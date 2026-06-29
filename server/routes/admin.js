import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
import {
  countUsers,
  countNewUsers24h,
  countDocuments,
  getUsageStats,
  listUsers,
} from '../services/userStore.js';

dotenv.config();

const router = Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (
  process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('生产环境必须设置 ADMIN_PASSWORD 环境变量'); })()
    : 'change-me'
);
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || (
  process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('生产环境必须设置 ADMIN_JWT_SECRET 环境变量'); })()
    : crypto.randomBytes(32).toString('hex')
);
const ADMIN_TOKEN_EXPIRES_IN = '12h';

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '需要管理员登录', requestId: req.id });
  }

  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: '权限不足', requestId: req.id });
    }
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: '管理员令牌无效或已过期', requestId: req.id });
  }
}

// 管理员登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: '账号或密码错误', requestId: req.id });
  }
  const token = jwt.sign({ role: 'admin', username }, ADMIN_JWT_SECRET, { expiresIn: ADMIN_TOKEN_EXPIRES_IN });
  res.json({ token, username });
});

// 统计概览
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const [totalUsers, newUsers24h, totalDocuments, usage] = await Promise.all([
      countUsers(),
      countNewUsers24h(),
      countDocuments(),
      getUsageStats(),
    ]);

    res.json({
      totalUsers,
      newUsers24h,
      totalDocuments,
      totalGenerations: usage.totalGenerations,
      generations7d: usage.generations7d,
      byAction: usage.byAction,
      dailyTrend: usage.dailyTrend,
      requestId: req.id,
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ error: '获取统计数据失败', requestId: req.id });
  }
});

// 用户注册记录（分页）
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const p = Math.max(1, parseInt(req.query.page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const { total, rows } = await listUsers({ page: p, limit: l });

    res.json({
      items: rows.map(row => ({
        id: row.id,
        username: row.username,
        email: row.email,
        createdAt: row.created_at,
        documentCount: row.document_count,
        generationCount: row.generation_count,
      })),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
      requestId: req.id,
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ error: '获取用户列表失败', requestId: req.id });
  }
});

export default router;
