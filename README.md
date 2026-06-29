# AI公众号写作助手

一站式公众号文章创作平台，集成热点追踪、AI生成、图片素材、一键排版。

## ✨ 功能特性

- 🔥 **热点追踪** - 百度/微博/抖音/知乎/B站/头条 6大平台实时热搜
- 🤖 **AI写作** - 支持 DeepSeek/OpenAI/Claude/Kimi/通义千问 等 11+ AI 服务商
- 🖼️ **图片素材** - Unsplash/Pexels/Pixabay 三大免费图库搜索
- ✨ **一键排版** - 8种内置公众号排版风格，一键复制到公众号编辑器
- 📝 **富文本编辑** - TipTap 编辑器，支持 Markdown、拖拽图片、快捷指令
- 💾 **本地存储** - 文章自动保存，支持版本历史

## 🚀 快速开始

### 一键启动（推荐）

```bash
chmod +x start.sh
./start.sh
```

启动后访问 http://localhost:7658

### 手动启动

需要同时启动 3 个服务：

```bash
# 终端1 - 热点聚合服务（端口 6688）
cd dailyhot-api && npx tsx src/index.ts

# 终端2 - 后端服务（端口 6356）
cd server && node index.js

# 终端3 - 前端服务（端口 7658）
cd app && npm run dev
```

## ⚙️ 配置

### AI 配置

在前端「设置」页面配置 API Key，或在 `server/.env` 中设置：

```env
DEFAULT_API_KEY=your-api-key
DEFAULT_MODEL=deepseek-chat
OPENAI_BASE_URL=https://api.deepseek.com/v1
```

### 图片 API（可选）

不配置则使用免费的 Lorem Picsum 替代：

```env
UNSPLASH_ACCESS_KEY=your-key
PEXELS_API_KEY=your-key
PIXABAY_API_KEY=your-key
```

## 📁 项目结构

```
ai公众号写作/
├── app/                    # 前端 (React + TypeScript + Vite)
│   ├── src/
│   │   ├── pages/         # 6个页面组件
│   │   ├── components/    # 编辑器、排版、预览等组件
│   │   ├── hooks/         # 自定义 Hooks
│   │   ├── services/      # API 调用
│   │   ├── stores/        # Zustand 状态管理
│   │   ├── lib/           # 工具函数、排版模板
│   │   └── types/         # TypeScript 类型定义
│   └── dist/              # 构建输出
├── server/                 # 后端 (Express)
│   ├── index.js           # 所有 API 路由
│   └── data/              # 文档存储（自动创建）
├── dailyhot-api/           # 热点聚合服务（第三方）
├── start.sh               # 一键启动脚本
└── README.md
```

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| UI库 | shadcn/ui + Lucide Icons |
| 状态 | Zustand + localStorage 持久化 |
| 编辑器 | TipTap (StarterKit + 扩展) |
| 后端 | Node.js + Express |
| 热点 | DailyHotApi |

## 📦 构建部署

### Vercel 部署

项目已包含根目录 `vercel.json`。推送到 GitHub 后，在 Vercel 导入仓库即可：

- Build Command: `cd app && npm run build`
- Output Directory: `app/dist`
- API: `/api/*` 会转发到 `api/index.js`，由 Express 后端处理。

生产环境至少配置这些环境变量：

```env
DATABASE_URL=postgresql://...
JWT_SECRET=生成一个足够长的随机字符串
ADMIN_USERNAME=你的管理员账号
ADMIN_PASSWORD=你的管理员密码
ADMIN_JWT_SECRET=生成另一个足够长的随机字符串
CORS_ORIGIN=https://你的-vercel-域名.vercel.app
```

如果使用 Vercel Postgres，也可以不手写 `DATABASE_URL`，项目会自动识别 Vercel 注入的 `POSTGRES_URL` / `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING`。

注册邮箱验证码还需要：

```env
BREVO_API_KEY=xkeysib-...
MAIL_FROM=已在 Brevo 验证的发件邮箱
MAIL_FROM_NAME=公众号AI写作
```

AI 默认模型如需服务端统一配置：

```env
DEFAULT_API_KEY=your-api-key
DEFAULT_MODEL=agnes-2.0-flash
OPENAI_BASE_URL=https://apihub.agnes-ai.com/v1
```

注意：Vercel Serverless 不适合长时间流式任务，文章流式生成已设置前端 45 秒超时；如果后续视频生成或长文生成经常超过 60 秒，建议把 `server/` 单独部署到 Railway/Render/Fly.io，再让前端调用该后端域名。

### 本地构建

```bash
# 前端构建
cd app && npm run build

# 后端启动
cd server && node index.js
```

前端构建产物在 `app/dist/`。Docker 部署可直接使用根目录 `Dockerfile`，会把前端构建产物复制到 Express 的 `server/public`。
