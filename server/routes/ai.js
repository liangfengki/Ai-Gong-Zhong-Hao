import { Router } from 'express';
import { getAIConfig, generateArticle, generateArticleStream, generateImage, createVideoTask, getVideoStatus, analyzeContent } from '../services/aiService.js';
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
      baseUrl,
      model: 'agnes-image-2.0-flash',
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

// AI 视频生成（提交任务并轮询等待完成）
router.post('/generate-video', aiValidation.generateVideo, optionalAuth, async (req, res) => {
  try {
    const { prompt, image } = req.body;
    const { apiKey, baseUrl } = getAIConfig(req);

    const taskResult = await createVideoTask({
      prompt,
      apiKey,
      baseUrl,
      model: 'agnes-video-v2.0',
      image,
    });

    // 提取任务ID - 兼容不同返回格式
    const taskId = taskResult.id || taskResult.task_id || taskResult.data?.id;

    if (!taskId) {
      // 如果直接返回了结果（非异步）
      const videoUrl = taskResult.data?.url || taskResult.url || taskResult.output?.video_url;
      if (videoUrl) {
        return res.json({ url: videoUrl, status: 'completed' });
      }
      throw new Error('无法获取任务ID');
    }

    // 轮询等待完成（最长10分钟）
    const maxAttempts = 120; // 120次 x 5秒 = 10分钟
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 等5秒

      const status = await getVideoStatus({ taskId, apiKey, baseUrl });
      const taskStatus = (status.status || status.data?.status || '').toUpperCase();

      if (taskStatus === 'SUCCESS' || taskStatus === 'COMPLETED') {
        // 从多个可能的位置提取视频 URL
        const videoUrl = status.data?.result_url
          || status.data?.data?.remixed_from_video_id
          || status.data?.url
          || status.output?.video_url
          || status.video_url;
        return res.json({ url: videoUrl, status: 'completed', taskId });
      }

      if (taskStatus === 'FAILED' || taskStatus === 'ERROR') {
        const errorMsg = status.data?.fail_reason || status.error || status.data?.error || '视频生成失败';
        return res.status(500).json({ error: errorMsg, taskId });
      }
    }

    // 超时
    res.status(408).json({
      error: '视频生成超时（10分钟），请稍后查询结果',
      taskId,
      status: 'timeout',
    });
  } catch (error) {
    console.error('视频生成失败:', {
      requestId: req.id,
      error: error.message,
    });
    const status = error.message.includes('API Key') ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
});

// 查询视频任务状态
router.get('/video-status/:taskId', optionalAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { apiKey, baseUrl } = getAIConfig(req);

    const status = await getVideoStatus({ taskId, apiKey, baseUrl });
    res.json(status);
  } catch (error) {
    console.error('查询视频状态失败:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// AI 文章智能分析
router.post('/analyze-content', aiValidation.analyzeContent, optionalAuth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const { apiKey, baseUrl, model } = getAIConfig(req);
    
    const analysis = await analyzeContent({ 
      title, 
      content, 
      apiKey, 
      baseUrl, 
      model: model || 'deepseek-chat' 
    });
    
    res.json({ 
      ...analysis,
      requestId: req.id,
      model,
    });
  } catch (error) {
    console.error('AI分析失败:', {
      requestId: req.id,
      error: error.message,
      title: req.body.title?.substring(0, 50),
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
