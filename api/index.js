import app from '../server/index.js';
import { initDB } from '../server/db.js';

let readyPromise;

function ensureReady() {
  if (!readyPromise) {
    readyPromise = initDB().catch((error) => {
      readyPromise = undefined;
      throw error;
    });
  }
  return readyPromise;
}

export default async function handler(req, res) {
  try {
    await ensureReady();
  } catch (error) {
    console.error('Vercel API 初始化失败:', error);
    return res.status(500).json({
      error: error.message || '服务初始化失败',
      code: 'SERVER_INIT_FAILED',
    });
  }
  return app(req, res);
}
