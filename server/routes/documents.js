import { Router } from 'express';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isDatabaseAvailable, query } from '../db.js';
import { documentValidation } from '../middleware/validation.js';
import { optionalAuth, authenticateToken } from '../middleware/auth.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fallbackFile = path.join(__dirname, '..', 'data', 'documents.json');
const memoryDocuments = new Map();

loadFallbackDocuments();

// 将数据库行映射为 API 响应格式
function mapRow(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function mapMemoryDocument(doc) {
  return {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    createdBy: doc.createdBy,
    updatedBy: doc.updatedBy,
  };
}

function getSortedMemoryDocuments() {
  return Array.from(memoryDocuments.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

function loadFallbackDocuments() {
  try {
    if (!fs.existsSync(fallbackFile)) return;
    const docs = JSON.parse(fs.readFileSync(fallbackFile, 'utf8'));
    if (!Array.isArray(docs)) return;
    memoryDocuments.clear();
    for (const doc of docs) {
      if (doc?.id) memoryDocuments.set(doc.id, doc);
    }
  } catch (error) {
    console.warn('读取文档 fallback 文件失败，将使用空文档列表:', error.message);
  }
}

function persistFallbackDocuments() {
  try {
    fs.mkdirSync(path.dirname(fallbackFile), { recursive: true });
    fs.writeFileSync(
      fallbackFile,
      JSON.stringify(getSortedMemoryDocuments(), null, 2),
      'utf8'
    );
  } catch (error) {
    console.error('写入文档 fallback 文件失败:', error.message);
  }
}

// 文档列表（支持分页）
router.get('/', documentValidation.list, authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (p - 1) * l;
    const userId = req.user.id;

    if (!isDatabaseAvailable()) {
      const sorted = getSortedMemoryDocuments();
      const items = sorted.slice(offset, offset + l).map((doc) => ({
        id: doc.id,
        title: doc.title,
        updatedAt: doc.updatedAt,
        createdAt: doc.createdAt,
      }));

      return res.json({
        items,
        total: sorted.length,
        page: p,
        limit: l,
        totalPages: Math.ceil(sorted.length / l),
        requestId: req.id,
        storage: 'file',
      });
    }

    const countResult = await query('SELECT COUNT(*) FROM documents WHERE user_id = $1', [userId]);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      'SELECT id, title, updated_at, created_at FROM documents WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2 OFFSET $3',
      [userId, l, offset]
    );

    const items = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
    }));

    res.json({
      items,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
      requestId: req.id,
    });
  } catch (error) {
    console.error('查询文档列表失败:', error);
    res.status(500).json({
      error: '查询文档列表失败',
      requestId: req.id,
    });
  }
});

// 获取单个文档
router.get('/:id', documentValidation.get, authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!isDatabaseAvailable()) {
      const doc = memoryDocuments.get(req.params.id);
      if (!doc) {
        return res.status(404).json({
          error: '文档不存在',
          requestId: req.id,
        });
      }
      return res.json({ ...mapMemoryDocument(doc), requestId: req.id, storage: 'file' });
    }

    const result = await query('SELECT * FROM documents WHERE id = $1 AND user_id = $2', [req.params.id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: '文档不存在',
        requestId: req.id,
      });
    }
    res.json({ ...mapRow(result.rows[0]), requestId: req.id });
  } catch (error) {
    console.error('获取文档失败:', error);
    res.status(500).json({
      error: '获取文档失败',
      requestId: req.id,
    });
  }
});

// 创建文档
router.post('/', documentValidation.create, authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title && !content) {
      return res.status(400).json({
        error: '请提供 title 或 content',
        requestId: req.id,
      });
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const userId = req.user.id;
    const createdBy = req.user.email;

    if (!isDatabaseAvailable()) {
      const doc = {
        id,
        title: title || '无标题',
        content: content || '',
        createdAt: now,
        updatedAt: now,
        createdBy,
        updatedBy: createdBy,
      };
      memoryDocuments.set(id, doc);
      persistFallbackDocuments();
      return res.status(201).json({ ...mapMemoryDocument(doc), requestId: req.id, storage: 'file' });
    }

    const result = await query(
      `INSERT INTO documents (id, user_id, title, content, created_at, updated_at, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $5, $6, $6)
       RETURNING *`,
      [id, userId, title || '无标题', content || '', now, createdBy]
    );

    res.status(201).json({ ...mapRow(result.rows[0]), requestId: req.id });
  } catch (error) {
    console.error('创建文档失败:', error);
    res.status(500).json({
      error: '创建文档失败',
      requestId: req.id,
    });
  }
});

// 更新文档
router.put('/:id', documentValidation.update, authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    const now = new Date().toISOString();
    const userId = req.user.id;
    const updatedBy = req.user.email;

    if (!isDatabaseAvailable()) {
      const existing = memoryDocuments.get(req.params.id);
      if (!existing) {
        return res.status(404).json({
          error: '文档不存在',
          requestId: req.id,
        });
      }

      const updated = {
        ...existing,
        title: title !== undefined ? title : existing.title,
        content: content !== undefined ? content : existing.content,
        updatedAt: now,
        updatedBy,
      };
      memoryDocuments.set(req.params.id, updated);
      persistFallbackDocuments();
      return res.json({ ...mapMemoryDocument(updated), requestId: req.id, storage: 'file' });
    }

    // 先检查文档是否存在
    const existing = await query('SELECT id FROM documents WHERE id = $1 AND user_id = $2', [req.params.id, userId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: '文档不存在',
        requestId: req.id,
      });
    }

    // 动态构建 SET 子句，只更新传入的字段
    const sets = [];
    const params = [];
    let paramIdx = 1;

    if (title !== undefined) {
      sets.push(`title = $${paramIdx++}`);
      params.push(title);
    }
    if (content !== undefined) {
      sets.push(`content = $${paramIdx++}`);
      params.push(content);
    }
    sets.push(`updated_at = $${paramIdx++}`);
    params.push(now);
    sets.push(`updated_by = $${paramIdx++}`);
    params.push(updatedBy);

    params.push(req.params.id);
    params.push(userId);

    const result = await query(
      `UPDATE documents SET ${sets.join(', ')} WHERE id = $${paramIdx++} AND user_id = $${paramIdx} RETURNING *`,
      params
    );

    res.json({ ...mapRow(result.rows[0]), requestId: req.id });
  } catch (error) {
    console.error('更新文档失败:', error);
    res.status(500).json({
      error: '更新文档失败',
      requestId: req.id,
    });
  }
});

// 删除文档
router.delete('/:id', documentValidation.delete, authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!isDatabaseAvailable()) {
      const existing = memoryDocuments.get(req.params.id);
      if (!existing) {
        return res.status(404).json({
          error: '文档不存在',
          requestId: req.id,
        });
      }
      memoryDocuments.delete(req.params.id);
      persistFallbackDocuments();
      return res.json({
        success: true,
        deletedId: existing.id,
        deletedTitle: existing.title,
        requestId: req.id,
        deletedBy: req.user.email,
        storage: 'file',
      });
    }

    const result = await query(
      'DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING id, title',
      [req.params.id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: '文档不存在',
        requestId: req.id,
      });
    }

    res.json({
      success: true,
      deletedId: result.rows[0].id,
      deletedTitle: result.rows[0].title,
      requestId: req.id,
      deletedBy: req.user.email,
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
