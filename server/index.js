import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import hotRoutes from './routes/hot.js';
import imageRoutes from './routes/images.js';
import aiRoutes from './routes/ai.js';
import documentRoutes from './routes/documents.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6356;

// ============ 中间件 ============

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// 请求日志
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/health') {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// 全局限流：每 IP 每分钟 100 次
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' },
});
app.use(globalLimiter);

// AI 接口更严格的限流：每 IP 每分钟 10 次
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI 生成请求过于频繁，请稍后再试' },
});
app.use('/ai', aiLimiter);

// ============ 健康检查 ============

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ============ 路由挂载 ============

app.use('/', hotRoutes);
app.use('/', imageRoutes);
app.use('/ai', aiRoutes);
app.use('/documents', documentRoutes);

// ============ 错误处理 ============

// 404
app.use((req, res) => {
  res.status(404).json({ error: `未找到路由: ${req.method} ${req.path}` });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('未捕获错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// ============ 启动 ============

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📝 热点API: http://localhost:${PORT}/baidu/hot`);
  console.log(`🖼️  图片API: http://localhost:${PORT}/unsplash/search`);
  console.log(`🤖 AI API: http://localhost:${PORT}/ai/generate`);
  console.log(`📄 文档API: http://localhost:${PORT}/documents`);
  console.log(`❤️  健康检查: http://localhost:${PORT}/health`);
});
