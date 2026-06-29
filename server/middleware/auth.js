import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// JWT密钥 - 生产环境必须从环境变量读取
const DEV_JWT_SECRET = crypto.randomBytes(32).toString('hex');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('生产环境必须设置 JWT_SECRET 环境变量');
  }
  return DEV_JWT_SECRET;
}

// 生成JWT令牌
export function generateToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

// 验证JWT令牌
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ 
      error: '访问被拒绝',
      message: '需要提供认证令牌',
      requestId: req.id,
    });
  }
  
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    next();
  } catch (error) {
    if (error.message === '生产环境必须设置 JWT_SECRET 环境变量') {
      return res.status(500).json({
        error: '认证服务未配置 JWT_SECRET',
        code: 'JWT_SECRET_MISSING',
        requestId: req.id,
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: '令牌已过期',
        message: '请重新登录',
        requestId: req.id,
      });
    }
    
    return res.status(403).json({ 
      error: '令牌无效',
      message: '认证失败',
      requestId: req.id,
    });
  }
}

// 可选认证 - 不强制要求令牌
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      req.user = decoded;
    } catch (error) {
      // 忽略无效令牌，继续处理请求
    }
  }
  
  next();
}

// 角色授权
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: '未认证',
        message: '需要先登录',
        requestId: req.id,
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: '权限不足',
        message: `需要角色: ${roles.join(', ')}`,
        requestId: req.id,
      });
    }
    
    next();
  };
}
