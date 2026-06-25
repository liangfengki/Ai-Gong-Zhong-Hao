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
  'https://apihub.agnes-ai.com',
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

// 获取 API 配置（服务端环境变量优先，前端设置作为 fallback）
export function getAIConfig(req) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.DEFAULT_API_KEY || req.headers['x-api-key'];
  let baseUrl = process.env.OPENAI_BASE_URL || req.headers['x-base-url'] || 'https://apihub.agnes-ai.com/v1';
  const model = process.env.DEFAULT_MODEL || req.headers['x-model'] || req.body?.model || 'mimo-auto';

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
export async function generateImage({ prompt, size, apiKey, baseUrl, model }) {
  if (!apiKey) {
    throw new Error('未配置 API Key，请在设置页或 server/.env 中配置');
  }

  const response = await axios.post(
    `${baseUrl.replace(/\/v1$/, '')}/v1/images/generations`,
    {
      model: model || 'agnes-image-2.0-flash',
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

// 创建视频生成任务
export async function createVideoTask({ prompt, apiKey, baseUrl, model, image }) {
  if (!apiKey) {
    throw new Error('未配置 API Key，请在设置页或 server/.env 中配置');
  }

  const requestBody = {
    model: model || 'agnes-video-v2.0',
    prompt,
  };

  if (image) {
    requestBody.image = Array.isArray(image) ? image : [image];
  }

  const response = await axios.post(
    `${baseUrl}/video/generations`,
    requestBody,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 60000,
    }
  );

  return response.data; // 返回任务信息，包含 task_id 或 id
}

// 查询视频任务状态
export async function getVideoStatus({ taskId, apiKey, baseUrl }) {
  if (!apiKey) {
    throw new Error('未配置 API Key');
  }

  const response = await axios.get(
    `${baseUrl}/video/generations/${taskId}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 30000,
    }
  );

  return response.data;
}

// 文章智能分析
export async function analyzeContent({ title, content, apiKey, baseUrl, model }) {
  if (!apiKey) {
    throw new Error('未配置 API Key，请在设置页或 server/.env 中配置');
  }

  const analysisPrompt = `你是一个专业的公众号文章分析专家。请对以下文章进行深度分析，并以严格的JSON格式返回分析结果。

【文章标题】
${title}

【文章内容】
${content}

请按照以下维度进行分析，并返回JSON格式的结果（不要包含任何其他文字，只返回JSON）：

{
  "qualityScore": <0-100的整数，综合内容质量评分>,
  "seo": {
    "titleSuggestion": "<标题优化建议>",
    "keywords": ["<推荐关键词1>", "<推荐关键词2>", "<推荐关键词3>"],
    "description": "<建议的SEO描述，50-100字>",
    "score": <0-100的SEO评分>
  },
  "readability": {
    "paragraphStructure": "<段落结构评价>",
    "avgSentenceLength": "<平均句子长度评价，如：适中/偏长/偏短>",
    "vocabularyDiversity": "<词汇多样性评价>",
    "score": <0-100的可读性评分>
  },
  "sentiment": {
    "tendency": "<情感倾向：积极/中性/消极>",
    "intensity": "<情感强度：强/中/弱>",
    "description": "<情感分析简述>"
  },
  "improvements": [
    "<改进建议1>",
    "<改进建议2>",
    "<改进建议3>",
    "<改进建议4>",
    "<改进建议5>"
  ]
}

评分标准：
- 质量评分：综合考虑内容深度、逻辑性、原创性、实用性
- SEO评分：考虑标题吸引力、关键词密度、描述准确性
- 可读性评分：考虑段落长度、句子复杂度、专业术语使用
- 改进建议：提供具体、可操作的优化建议`;

  const response = await axios.post(
    `${baseUrl}/chat/completions`,
    {
      model,
      messages: [
        { role: 'system', content: '你是一个专业的文章分析AI，只返回JSON格式的分析结果，不要包含任何其他文字。' },
        { role: 'user', content: analysisPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.3, // 低温度以获得更稳定的JSON输出
      response_format: { type: 'json_object' },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 120000, // 2 分钟超时
    }
  );

  const responseContent = response.data.choices[0].message.content;
  
  try {
    // 解析AI返回的JSON
    const analysis = JSON.parse(responseContent);
    
    // 验证并规范化返回结果
    return {
      qualityScore: Math.min(100, Math.max(0, analysis.qualityScore || 0)),
      seo: {
        titleSuggestion: analysis.seo?.titleSuggestion || '',
        keywords: Array.isArray(analysis.seo?.keywords) ? analysis.seo.keywords.slice(0, 5) : [],
        description: analysis.seo?.description || '',
        score: Math.min(100, Math.max(0, analysis.seo?.score || 0)),
      },
      readability: {
        paragraphStructure: analysis.readability?.paragraphStructure || '',
        avgSentenceLength: analysis.readability?.avgSentenceLength || '未知',
        vocabularyDiversity: analysis.readability?.vocabularyDiversity || '',
        score: Math.min(100, Math.max(0, analysis.readability?.score || 0)),
      },
      sentiment: {
        tendency: analysis.sentiment?.tendency || '中性',
        intensity: analysis.sentiment?.intensity || '中',
        description: analysis.sentiment?.description || '',
      },
      improvements: Array.isArray(analysis.improvements) ? analysis.improvements.slice(0, 10) : [],
    };
  } catch (parseError) {
    console.error('AI分析结果解析失败:', parseError.message);
    throw new Error('AI分析结果格式异常，请重试');
  }
}
