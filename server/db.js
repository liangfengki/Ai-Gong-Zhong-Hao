import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Railway 的 PostgreSQL 需要 SSL
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

// 包装查询方法
export function query(text, params) {
  return pool.query(text, params);
}

// 初始化数据库：建表
export async function initDB() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL DEFAULT '无标题',
        content TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by TEXT DEFAULT 'anonymous',
        updated_by TEXT DEFAULT 'anonymous'
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_documents_updated_at
      ON documents(updated_at DESC);
    `);

    console.log('✅ PostgreSQL 数据库初始化完成');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    // 没有 DATABASE_URL 时降级为日志提示，不阻塞启动
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️  未设置 DATABASE_URL，文档功能将不可用');
    } else {
      throw error;
    }
  }
}

export default pool;
