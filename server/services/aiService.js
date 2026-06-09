import axios from 'axios';

// 允许的 AI API 域名白名单（防止 SSRF）
const ALLOWED_BASE_URLS = [
  'https://api.deepseek.com',
  'https://api.openai.com',
  'https://api.anthropic.com',
  'https://api.moonshot.cn',
  'https://dashscope.aliyuncs.com',
  'https://open.bigmodel.cn',
  'https://api.baichuan-ai.com',
  'https://api.lingyiwanwu.com',
  'https://openrouter.ai',
  'https://api.siliconflow.cn',
  'https://api.hunyuan.cloud.tencent.com',
];

function isAllowedBaseUrl(url) {
  try {
    const parsed = new URL(url);
    // 禁止内网地址
    const hostname = parsed.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.match(/^172\.(1[6-9]|2\d|3[01])\./) ||
      hostname === '[::1]' ||
      hostname.endsWith('.local')
    ) {
      return false;
    }
    return ALLOWED_BASE_URLS.some(allowed => url.startsWith(allowed));
  } catch {
    return false;
  }
}

// 获取 API 配置（支持前端自定义 > 环境变量）
export function getAIConfig(req) {
  const apiKey = req.headers['x-api-key'] || process.env.OPENAI_API_KEY || process.env.DEFAULT_API_KEY;
  let baseUrl = req.headers['x-base-url'] || process.env.OPENAI_BASE_URL || 'https://api.deepseek.com/v1';
  const model = req.headers['x-model'] || req.body?.model || process.env.DEFAULT_MODEL || 'deepseek-chat';

  // SSRF 防护：验证 base URL
  if (req.headers['x-base-url'] && !isAllowedBaseUrl(baseUrl)) {
    throw new Error('不支持的 API 地址，请使用已知的 AI 服务商地址');
  }

  // 自动补全 /v1 后缀（兼容不带 /v1 的中转站）
  baseUrl = baseUrl.replace(/\/$/, '');
  if (!baseUrl.match(/\/v1(\/)?$/)) {
    baseUrl = baseUrl + '/v1';
  }

  return { apiKey, baseUrl, model };
}

// 生成文章
export async function generateArticle({ prompt, wordCount, apiKey, baseUrl, model }) {
  if (!apiKey) {
    throw new Error('未配置 API Key，请在设置页或 server/.env 中配置');
  }

  const response = await axios.post(
    `${baseUrl}/chat/completions`,
    {
      model,
      messages: [
        { role: 'system', content: '你是一个专业的公众号文章写手，擅长写有深度、有温度的文章。' },
        { role: 'user', content: `${prompt}\n\n请生成约${wordCount}字的文章。` },
      ],
      max_tokens: Math.min(wordCount * 2, 4000),
      temperature: 0.7,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 120000, // 2 分钟超时
    }
  );

  return response.data.choices[0].message.content;
}

// 流式生成文章（SSE 格式）
export async function generateArticleStream({ prompt, wordCount, apiKey, baseUrl, model, res }) {
  if (!apiKey) {
    throw new Error('未配置 API Key，请在设置页或 server/.env 中配置');
  }

  const response = await axios.post(
    `${baseUrl}/chat/completions`,
    {
      model,
      messages: [
        { role: 'system', content: '你是一个专业的公众号文章写手，擅长写有深度、有温度的文章。' },
        { role: 'user', content: `${prompt}\n\n请生成约${wordCount}字的文章。` },
      ],
      max_tokens: Math.min(wordCount * 2, 4000),
      temperature: 0.7,
      stream: true,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      responseType: 'stream',
      timeout: 300000, // 5 分钟超时（流式生成较慢）
    }
  );

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let closed = false;

  const closeStream = () => {
    if (closed) return;
    closed = true;
    try { res.end(); } catch { /* already closed */ }
  };

  response.data.on('data', (chunk) => {
    if (closed) return;
    const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n');
          closeStream();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content || '';
          if (content && !closed) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        } catch {
          // ignore parse errors
        }
      }
    }
  });

  response.data.on('end', () => {
    if (!closed) {
      res.write('data: [DONE]\n\n');
    }
    closeStream();
  });

  response.data.on('error', (err) => {
    if (!closed) {
      try { res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`); } catch { /* ignore */ }
    }
    closeStream();
  });
}

// 生成图片
export async function generateImage({ prompt, size, apiKey, baseUrl }) {
  if (!apiKey) {
    throw new Error('未配置 API Key，请在设置页或 server/.env 中配置');
  }

  const response = await axios.post(
    `${baseUrl.replace(/\/v1$/, '')}/v1/images/generations`,
    {
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: size || '1024x1024',
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 120000, // 2 分钟超时
    }
  );

  return response.data.data[0].url;
}
