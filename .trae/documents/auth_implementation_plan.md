# 用户认证系统实施计划

## 1. 概述
为公众号 AI 写作平台增加完整的用户认证系统，支持邮箱注册（含验证码）、账号密码登录、密码修改，并实现用户数据隔离（文章按用户存储）。本计划严格遵循项目 `spec/` 下的文档规范。

## 2. 核心约束文件更新 (AGENTS.md & Spec)

### 2.1 更新 `AGENTS.md`
在文件末尾增加用户认证相关模块说明：
- **Auth System**: `server/routes/auth.js` 负责注册登录，`server/services/emailService.js` 负责邮件发送。
- **State**: `app/src/stores/useAuthStore.ts` 管理登录态。
- **Database**: PostgreSQL `users` 表存储用户，`documents` 表关联 `user_id`。

### 2.2 更新 `spec/SPEC.md`
在“系统机制”中补充：
- **认证机制**: 邮箱+验证码注册，JWT 鉴权，Brevo SMTP 邮件服务。
- **数据隔离**: 所有文档操作强制绑定 `user_id`。

### 2.3 更新 `spec/ACCEPTANCE.md`
新增“用户认证验收”章节（详见下文第 7 节）。

## 3. 技术栈与依赖
- **后端**: Node.js + Express (已有)
- **数据库**: PostgreSQL (已有 `pg` 依赖)
- **认证**: JWT (`jsonwebtoken` 已有), `bcryptjs` (已有)
- **邮件**: `nodemailer` (需新增)

## 4. 数据库设计

### 4.1 `users` 表
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.2 `verification_codes` 表
```sql
CREATE TABLE IF NOT EXISTS verification_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.3 `documents` 表修改
```sql
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_documents_user_id ON documents(user_id);
```

## 5. 后端实现细节

### 5.1 邮件服务 `server/services/emailService.js`
- 使用 `nodemailer` 配置 SMTP。
- Host: `smtp-relay.brevo.com`, Port: `587`。
- Auth: User 和 Pass 使用提供的 SMTP Key (`xsmtpsib-...`)。

### 5.2 认证路由 `server/routes/auth.js`
- `POST /api/auth/register/request-code`: 发送验证码。
- `POST /api/auth/register/verify`: 验证码校验并创建用户。
- `POST /api/auth/login`: 登录返回 JWT。
- `PUT /api/auth/change-password`: 修改密码 (需登录)。
- `GET /api/auth/me`: 获取当前用户信息。

### 5.3 文档路由更新 `server/routes/documents.js`
- 引入 `authenticateToken` 中间件。
- 所有查询增加 `WHERE user_id = $1` 过滤。
- 创建文档时自动注入 `req.user.id`。

## 6. 前端实现细节

### 6.1 页面与路由
- 新增 `/login`, `/register` 路由。
- 使用 `ProtectedRoute` 包裹受保护页面。

### 6.2 状态管理 `useAuthStore.ts`
- 持久化 `token` 至 localStorage。
- 封装 `login`, `register`, `logout` 方法。
- Axios 拦截器自动附加 `Authorization` Header。

### 6.3 数据迁移
- 登录成功后检查 `useAppStore` 中的文章。
- 若存在本地文章，提示用户上传至服务端。
- 调用 `POST /api/documents` 批量保存，成功后清除本地缓存。

## 7. 验收标准 (ACCEPTANCE)

1.  **注册流程**: 输入邮箱 -> 获取验证码 -> 输入验证码 -> 注册成功。
2.  **登录流程**: 输入邮箱密码 -> 登录成功 -> 跳转首页。
3.  **数据隔离**: 用户 A 创建的文章，用户 B 不可见。
4.  **密码修改**: 登录状态下可修改密码，修改后旧密码失效。
5.  **本地迁移**: 登录后若有本地文章，提示上传；上传后服务端可见。
6.  **稳定性**: `npm run build` 和 `npm run lint` 通过。

## 8. 实施步骤
1.  修改 `AGENTS.md` 和 `spec/` 文档。
2.  更新 `server/db.js` 建表。
3.  实现 `server/services/emailService.js`。
4.  实现 `server/routes/auth.js`。
5.  修改 `server/routes/documents.js`。
6.  实现前端 `useAuthStore.ts` 和页面。
7.  实现数据迁移逻辑。
