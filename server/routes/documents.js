import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { documentValidation } from '../middleware/validation.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
const DATA_DIR = path.join(process.cwd(), 'data');
const DOCS_FILE = path.join(DATA_DIR, 'documents.json');

// 内存缓存，避免每次请求都读磁盘
let docsCache = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDocuments() {
  if (docsCache) return docsCache;
  try {
    if (fs.existsSync(DOCS_FILE)) {
      docsCache = JSON.parse(fs.readFileSync(DOCS_FILE, 'utf-8'));
      return docsCache;
    }
  } catch {
    // 文件损坏时返回空数组
  }
  docsCache = [];
  return docsCache;
}

// 原子写入：先写临时文件再重命名，避免写入中断导致数据丢失
function saveDocuments(docs) {
  ensureDataDir();
  const tmpFile = DOCS_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(docs, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DOCS_FILE);
  docsCache = docs; // 更新缓存
}

// 写入队列：防止并发写入导致数据丢失（TOCTOU 竞态）
let writeQueue = Promise.resolve();
function withWriteLock(fn) {
  const result = writeQueue.then(fn, fn);
  writeQueue = result.catch(() => {});
  return result;
}

// 文档列表（支持分页）
router.get('/', documentValidation.list, optionalAuth, (req, res) => {
  const docs = loadDocuments();
  const { page = 1, limit = 50 } = req.query;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const start = (p - 1) * l;
  const items = docs.slice(start, start + l).map(({ id, title, updatedAt, createdAt }) => ({
    id, title, updatedAt, createdAt,
  }));
  res.json({
    items,
    total: docs.length,
    page: p,
    limit: l,
    totalPages: Math.ceil(docs.length / l),
    requestId: req.id,
  });
});

// 获取单个文档
router.get('/:id', documentValidation.get, optionalAuth, (req, res) => {
  const docs = loadDocuments();
  const doc = docs.find(d => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ 
      error: '文档不存在',
      requestId: req.id,
    });
  }
  res.json({ ...doc, requestId: req.id });
});

// 创建文档
router.post('/', documentValidation.create, optionalAuth, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title && !content) {
      return res.status(400).json({ 
        error: '请提供 title 或 content',
        requestId: req.id,
      });
    }
    
    const doc = await withWriteLock(() => {
      const docs = loadDocuments();
      const now = new Date().toISOString();
      const doc = {
        id: randomUUID(),
        title: title || '无标题',
        content: content || '',
        createdAt: now,
        updatedAt: now,
        createdBy: req.user?.id || 'anonymous',
      };
      docs.push(doc);
      saveDocuments(docs);
      return doc;
    });
    
    res.status(201).json({ ...doc, requestId: req.id });
  } catch (error) {
    console.error('创建文档失败:', error);
    res.status(500).json({ 
      error: '创建文档失败',
      requestId: req.id,
    });
  }
});

// 更新文档
router.put('/:id', documentValidation.update, optionalAuth, async (req, res) => {
  try {
    const result = await withWriteLock(() => {
      const docs = loadDocuments();
      const idx = docs.findIndex(d => d.id === req.params.id);
      if (idx === -1) return { error: 404, message: '文档不存在' };
      
      const { title, content } = req.body;
      if (title !== undefined) docs[idx].title = title;
      if (content !== undefined) docs[idx].content = content;
      docs[idx].updatedAt = new Date().toISOString();
      docs[idx].updatedBy = req.user?.id || 'anonymous';
      
      saveDocuments(docs);
      return { doc: docs[idx] };
    });
    
    if (result.error) {
      return res.status(result.error).json({ 
        error: result.message,
        requestId: req.id,
      });
    }
    
    res.json({ ...result.doc, requestId: req.id });
  } catch (error) {
    console.error('更新文档失败:', error);
    res.status(500).json({ 
      error: '更新文档失败',
      requestId: req.id,
    });
  }
});

// 删除文档
router.delete('/:id', documentValidation.delete, optionalAuth, async (req, res) => {
  try {
    const result = await withWriteLock(() => {
      const docs = loadDocuments();
      const idx = docs.findIndex(d => d.id === req.params.id);
      if (idx === -1) return { error: 404, message: '文档不存在' };
      
      // 记录删除操作
      const deletedDoc = docs[idx];
      docs.splice(idx, 1);
      saveDocuments(docs);
      
      return { 
        success: true, 
        deletedId: deletedDoc.id,
        deletedTitle: deletedDoc.title,
      };
    });
    
    if (result.error) {
      return res.status(result.error).json({ 
        error: result.message,
        requestId: req.id,
      });
    }
    
    res.json({ 
      ...result, 
      requestId: req.id,
      deletedBy: req.user?.id || 'anonymous',
    });
  } catch (error) {
    console.error('删除文档失败:', error);
    res.status(500).json({ 
      error: '删除文档失败',
      requestId: req.id,
    });
  }
});

export default router;
