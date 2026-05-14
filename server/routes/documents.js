import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const router = Router();
const DATA_DIR = path.join(process.cwd(), 'data');
const DOCS_FILE = path.join(DATA_DIR, 'documents.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDocuments() {
  try {
    if (fs.existsSync(DOCS_FILE)) {
      return JSON.parse(fs.readFileSync(DOCS_FILE, 'utf-8'));
    }
  } catch {
    // 文件损坏时返回空数组
  }
  return [];
}

// 原子写入：先写临时文件再重命名，避免写入中断导致数据丢失
function saveDocuments(docs) {
  ensureDataDir();
  const tmpFile = DOCS_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(docs, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DOCS_FILE);
}

// 文档列表（支持分页）
router.get('/', (req, res) => {
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
  });
});

// 获取单个文档
router.get('/:id', (req, res) => {
  const docs = loadDocuments();
  const doc = docs.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: '文档不存在' });
  res.json(doc);
});

// 创建文档
router.post('/', (req, res) => {
  const { title, content } = req.body;
  if (!title && !content) {
    return res.status(400).json({ error: '请提供 title 或 content' });
  }
  const docs = loadDocuments();
  const now = new Date().toISOString();
  const doc = {
    id: randomUUID(),
    title: title || '无标题',
    content: content || '',
    createdAt: now,
    updatedAt: now,
  };
  docs.push(doc);
  saveDocuments(docs);
  res.status(201).json(doc);
});

// 更新文档
router.put('/:id', (req, res) => {
  const docs = loadDocuments();
  const idx = docs.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '文档不存在' });
  const { title, content } = req.body;
  if (title !== undefined) docs[idx].title = title;
  if (content !== undefined) docs[idx].content = content;
  docs[idx].updatedAt = new Date().toISOString();
  saveDocuments(docs);
  res.json(docs[idx]);
});

// 删除文档
router.delete('/:id', (req, res) => {
  const docs = loadDocuments();
  const idx = docs.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '文档不存在' });
  docs.splice(idx, 1);
  saveDocuments(docs);
  res.json({ success: true });
});

export default router;
