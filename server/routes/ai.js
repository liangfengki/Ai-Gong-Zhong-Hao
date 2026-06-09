import { Router } from 'express';
import { getAIConfig, generateArticle, generateArticleStream, generateImage } from '../services/aiService.js';
import { aiValidation } from '../middleware/validation.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// AI 生成文章
router.post('/generate', aiValidation.generate, optionalAuth, async (req, res) => {
  try {
    const { prompt, wordCount } = req.body;
    const { apiKey, baseUrl, model } = getAIConfig(req);
    
    const content = await generateArticle({ 
      prompt, 
      wordCount: wordCount || 1000, 
      apiKey, 
      baseUrl, 
      model 
    });
    
    res.json({ 
      content,
      requestId: req.id,
      model,
      wordCount: content.length,
    });
  } catch (error) {
    console.error('AI生成失败:', {
      requestId: req.id,
      error: error.message,
      prompt: req.body.prompt?.substring(0, 100),
    });
    
    const status = error.message.includes('API Key') ? 400 : 500;
    res.status(status).json({ 
      error: error.message,
      requestId: req.id,
      type: error.name || 'AIError',
    });
  }
});

// AI 流式生成
router.post('/generate/stream', aiValidation.generate, optionalAuth, async (req, res) => {
  try {
    const { prompt, wordCount } = req.body;
    const { apiKey, baseUrl, model } = getAIConfig(req);
    
    await generateArticleStream({ 
      prompt, 
      wordCount: wordCount || 1000, 
      apiKey, 
      baseUrl, 
      model, 
      res,
      requestId: req.id,
    });
  } catch (error) {
    console.error('AI流式生成失败:', {
      requestId: req.id,
      error: error.message,
      prompt: req.body.prompt?.substring(0, 100),
    });
    
    if (!res.headersSent) {
      const status = error.message.includes('API Key') ? 400 : 500;
      res.status(status).json({ 
        error: error.message,
        requestId: req.id,
        type: error.name || 'AIError',
      });
    }
  }
});

// AI 图片生成
router.post('/generate-image', aiValidation.generateImage, optionalAuth, async (req, res) => {
  try {
    const { prompt, size } = req.body;
    const { apiKey, baseUrl } = getAIConfig(req);
    
    const url = await generateImage({ 
      prompt, 
      size: size || '1024x1024', 
      apiKey, 
      baseUrl 
    });
    
    res.json({ 
      url,
      requestId: req.id,
      prompt,
      size: size || '1024x1024',
    });
  } catch (error) {
    console.error('AI图片生成失败:', {
      requestId: req.id,
      error: error.message,
      prompt: req.body.prompt?.substring(0, 100),
    });
    
    const status = error.message.includes('API Key') ? 400 : 500;
    res.status(status).json({ 
      error: error.message,
      requestId: req.id,
      type: error.name || 'AIError',
    });
  }
});

export default router;
