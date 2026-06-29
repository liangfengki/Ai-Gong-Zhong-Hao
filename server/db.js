import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const pool = hasDatabaseUrl
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      // Railway 的 PostgreSQL 需要 SSL
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    })
  : null;

let databaseAvailable = hasDatabaseUrl;

// 包装查询方法
export function query(text, params) {
  if (!pool) {
    throw new Error('未配置 DATABASE_URL');
  }
  return pool.query(text, params);
}

export function isDatabaseAvailable() {
  return databaseAvailable;
}

// 初始化数据库：建表
export async function initDB() {
  if (!hasDatabaseUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('生产环境必须设置 DATABASE_URL');
    }
    databaseAvailable = false;
    console.warn('⚠️  未设置 DATABASE_URL，文档 API 将使用本地文件 fallback 存储');
    return;
  }

  try {
    await query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        email VARCHAR(255),
        action VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON usage_logs(action);
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL DEFAULT '无标题',
        content TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by TEXT DEFAULT 'anonymous',
        updated_by TEXT DEFAULT 'anonymous'
      );

      ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
      ALTER TABLE documents ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'anonymous';
      ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_by TEXT DEFAULT 'anonymous';
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_documents_updated_at
      ON documents(updated_at DESC);

      CREATE INDEX IF NOT EXISTS idx_documents_user_id
      ON documents(user_id);
    `);

    console.log('✅ PostgreSQL 数据库初始化完成');
    databaseAvailable = true;
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    databaseAvailable = false;
    throw error;
  }
}

export default pool;
