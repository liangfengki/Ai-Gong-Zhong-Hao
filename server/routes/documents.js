import { Router } from 'express';
import { randomUUID } from 'crypto';
import { query } from '../db.js';
import { documentValidation } from '../middleware/validation.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

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

// 文档列表（支持分页）
router.get('/', documentValidation.list, optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (p - 1) * l;

    const countResult = await query('SELECT COUNT(*) FROM documents');
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      'SELECT id, title, updated_at, created_at FROM documents ORDER BY updated_at DESC LIMIT $1 OFFSET $2',
      [l, offset]
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
router.get('/:id', documentValidation.get, optionalAuth, async (req, res) => {
  try {
    const result = await query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
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
router.post('/', documentValidation.create, optionalAuth, async (req, res) => {
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
    const createdBy = req.user?.id || 'anonymous';

    const result = await query(
      `INSERT INTO documents (id, title, content, created_at, updated_at, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $4, $5, $5)
       RETURNING *`,
      [id, title || '无标题', content || '', now, createdBy]
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
router.put('/:id', documentValidation.update, optionalAuth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const now = new Date().toISOString();
    const updatedBy = req.user?.id || 'anonymous';

    // 先检查文档是否存在
    const existing = await query('SELECT id FROM documents WHERE id = $1', [req.params.id]);
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

    const result = await query(
      `UPDATE documents SET ${sets.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
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
router.delete('/:id', documentValidation.delete, optionalAuth, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM documents WHERE id = $1 RETURNING id, title',
      [req.params.id]
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
