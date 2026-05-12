import { Router } from 'express';
import { getAIConfig, generateArticle, generateArticleStream, generateImage } from '../services/aiService.js';

const router = Router();

// AI 生成文章
router.post('/generate', async (req, res) => {
  try {
    const { prompt, wordCount } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: '请提供 prompt 参数' });
    }

    const { apiKey, baseUrl, model } = getAIConfig(req);
    const content = await generateArticle({ prompt, wordCount: wordCount || 1000, apiKey, baseUrl, model });
    res.json({ content });
  } catch (error) {
    console.error('AI生成失败:', error.message);
    const status = error.message.includes('API Key') ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
});

// AI 流式生成
router.post('/generate/stream', async (req, res) => {
  try {
    const { prompt, wordCount } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: '请提供 prompt 参数' });
    }

    const { apiKey, baseUrl, model } = getAIConfig(req);
    await generateArticleStream({ prompt, wordCount: wordCount || 1000, apiKey, baseUrl, model, res });
  } catch (error) {
    console.error('AI流式生成失败:', error.message);
    if (!res.headersSent) {
      const status = error.message.includes('API Key') ? 400 : 500;
      res.status(status).json({ error: error.message });
    }
  }
});

// AI 图片生成
router.post('/generate-image', async (req, res) => {
  try {
    const { prompt, size } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: '请提供 prompt 参数' });
    }

    const { apiKey, baseUrl } = getAIConfig(req);
    const url = await generateImage({ prompt, size, apiKey, baseUrl });
    res.json({ url });
  } catch (error) {
    console.error('AI图片生成失败:', error.message);
    const status = error.message.includes('API Key') ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
});

export default router;
