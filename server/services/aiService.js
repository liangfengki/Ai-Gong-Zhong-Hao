import axios from 'axios';

// 获取 API 配置（支持前端自定义 > 环境变量）
export function getAIConfig(req) {
  const apiKey = req.headers['x-api-key'] || process.env.OPENAI_API_KEY || process.env.DEFAULT_API_KEY;
  let baseUrl = req.headers['x-base-url'] || process.env.OPENAI_BASE_URL || 'https://api.deepseek.com/v1';
  const model = req.headers['x-model'] || req.body?.model || process.env.DEFAULT_MODEL || 'deepseek-chat';

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
    }
  );

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  response.data.on('data', (chunk) => {
    const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content || '';
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        } catch {
          // ignore parse errors
        }
      }
    }
  });

  response.data.on('end', () => {
    res.write('data: [DONE]\n\n');
    res.end();
  });

  response.data.on('error', (err) => {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
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
    }
  );

  return response.data.data[0].url;
}
