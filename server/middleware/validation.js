import { body, param, query, validationResult } from 'express-validator';

// 处理验证错误
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: '验证失败',
      message: '请求数据不符合要求',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
      requestId: req.id,
    });
  }
  next();
}

// 文档验证规则
export const documentValidation = {
  create: [
    body('title')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('标题不能超过200个字符')
      .escape(),
    body('content')
      .optional()
      .trim()
      .isLength({ max: 100000 })
      .withMessage('内容不能超过100,000个字符'),
    handleValidationErrors,
  ],
  
  update: [
    param('id')
      .isUUID()
      .withMessage('无效的文档ID'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('标题不能超过200个字符')
      .escape(),
    body('content')
      .optional()
      .trim()
      .isLength({ max: 100000 })
      .withMessage('内容不能超过100,000个字符'),
    handleValidationErrors,
  ],
  
  delete: [
    param('id')
      .isUUID()
      .withMessage('无效的文档ID'),
    handleValidationErrors,
  ],
  
  get: [
    param('id')
      .isUUID()
      .withMessage('无效的文档ID'),
    handleValidationErrors,
  ],
  
  list: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是大于0的整数'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须在1-100之间'),
    handleValidationErrors,
  ],
};

// AI生成验证规则
export const aiValidation = {
  generate: [
    body('prompt')
      .trim()
      .notEmpty()
      .withMessage('提示词不能为空')
      .isLength({ max: 10000 })
      .withMessage('提示词不能超过10,000个字符'),
    body('wordCount')
      .optional()
      .isInt({ min: 100, max: 10000 })
      .withMessage('字数必须在100-10000之间'),
    handleValidationErrors,
  ],
  
  generateImage: [
    body('prompt')
      .trim()
      .notEmpty()
      .withMessage('提示词不能为空')
      .isLength({ max: 1000 })
      .withMessage('提示词不能超过1,000个字符'),
    body('size')
      .optional()
      .isIn(['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792', '1024x768', '768x1024'])
      .withMessage('无效的图片尺寸'),
    handleValidationErrors,
  ],

  generateVideo: [
    body('prompt')
      .trim()
      .notEmpty()
      .withMessage('提示词不能为空')
      .isLength({ max: 2000 })
      .withMessage('提示词不能超过2,000个字符'),
    body('image')
      .optional(),
    handleValidationErrors,
  ],

  analyzeContent: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('文章标题不能为空')
      .isLength({ max: 200 })
      .withMessage('标题不能超过200个字符'),
    body('content')
      .trim()
      .notEmpty()
      .withMessage('文章内容不能为空')
      .isLength({ max: 50000 })
      .withMessage('内容不能超过50,000个字符'),
    handleValidationErrors,
  ],
};

// 图片搜索验证规则
export const imageValidation = {
  search: [
    query('query')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('搜索词不能超过200个字符'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是大于0的整数'),
    query('per_page')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('每页数量必须在1-50之间'),
    handleValidationErrors,
  ],
};

// 热点验证规则
export const hotValidation = {
  source: [
    param('source')
      .isIn(['baidu', 'weibo', 'douyin', 'zhihu', 'toutiao', 'bilibili'])
      .withMessage('不支持的热点源'),
    handleValidationErrors,
  ],
};

// 用户验证规则
export const userValidation = {
  register: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('用户名必须在3-30个字符之间')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('用户名只能包含字母、数字和下划线'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('密码至少需要6个字符'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('无效的邮箱地址')
      .normalizeEmail(),
    handleValidationErrors,
  ],
  
  login: [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('用户名不能为空'),
    body('password')
      .notEmpty()
      .withMessage('密码不能为空'),
    handleValidationErrors,
  ],
};

// 通用验证工具
export const commonValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是大于0的整数'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须在1-100之间'),
    handleValidationErrors,
  ],
  
  id: [
    param('id')
      .isUUID()
      .withMessage('无效的ID格式'),
    handleValidationErrors,
  ],
};

// 清理和消毒工具
export function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}