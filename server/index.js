import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import { initDB } from './db.js';
import hotRoutes from './routes/hot.js';
import imageRoutes from './routes/images.js';
import aiRoutes from './routes/ai.js';
import documentRoutes from './routes/documents.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 6356;

// Railway 等反向代理需要信任 X-Forwarded-* 头
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ============ 安全中间件 ============

// 安全头
app.use(helmet({
  contentSecurityPolicy: false, // 开发环境禁用CSP
  crossOriginEmbedderPolicy: false,
}));

// CORS配置 - 生产环境严格限制
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:7658', 'http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? corsOrigins : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-base-url', 'x-model'],
  maxAge: 86400,
  credentials: true,
}));

// 请求体大小限制
app.use(express.json({ limit: '1mb' }));

// 请求ID和日志
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || Math.random().toString(36).substring(2, 15);
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/health') {
      const logData = {
        requestId: req.id,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      };
      
      if (res.statusCode >= 400) {
        console.error('请求失败:', JSON.stringify(logData));
      } else {
        console.log('请求成功:', JSON.stringify(logData));
      }
    }
  });
  next();
});

// 全局限流：每 IP 每分钟 100 次
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_PER_MINUTE) || 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' },
});
app.use(globalLimiter);

// AI 接口更严格的限流：每 IP 每分钟 10 次
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.AI_RATE_LIMIT_PER_MINUTE) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI 生成请求过于频繁，请稍后再试' },
});
app.use('/api/ai', aiLimiter);

// ============ 健康检查 ============

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ============ 路由挂载 ============

// 所有 API 路由挂载到 /api 前缀（与前端 PROXY_BASE='/api' 一致）
app.use('/api', hotRoutes);
app.use('/api', imageRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// ============ 静态文件服务（前端 SPA） ============

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// SPA fallback：所有非 API 请求返回 index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') return next();
  // 只处理 HTML 请求（非文件扩展名）
  if (req.path.includes('.')) return next();
  res.sendFile(path.join(publicDir, 'index.html'), (err) => {
    if (err) next();
  });
});

// ============ 错误处理 ============

// 404处理
app.use((req, res) => {
  res.status(404).json({ 
    error: '未找到路由',
    path: req.path,
    method: req.method,
    requestId: req.id,
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  // 错误分类
  const errorType = err.name || 'UnknownError';
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;
  
  // 日志记录
  const errorLog = {
    requestId: req.id,
    type: errorType,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  };
  
  if (statusCode >= 500) {
    console.error('服务器错误:', JSON.stringify(errorLog));
  } else {
    console.warn('客户端错误:', JSON.stringify(errorLog));
  }
  
  // 响应
  res.status(statusCode).json({
    error: isOperational ? err.message : '服务器内部错误',
    type: errorType,
    requestId: req.id,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============ 启动 ============

async function start() {
  // 初始化数据库
  await initDB();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📝 热点API: http://localhost:${PORT}/api/baidu/hot`);
    console.log(`🖼️  图片API: http://localhost:${PORT}/api/unsplash/search`);
    console.log(`🤖 AI API: http://localhost:${PORT}/api/ai/generate`);
    console.log(`📄 文档API: http://localhost:${PORT}/api/documents`);
    console.log(`❤️  健康检查: http://localhost:${PORT}/health`);
  });
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  start().catch(err => {
    console.error('启动失败:', err);
    process.exit(1);
  });
}

export { app, start };
export default app;
