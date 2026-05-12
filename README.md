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

启动后访问 http://localhost:5173

### 手动启动

需要同时启动 3 个服务：

```bash
# 终端1 - 热点聚合服务（端口 6688）
cd dailyhot-api && npx tsx src/index.ts

# 终端2 - 后端服务（端口 6356）
cd server && node index.js

# 终端3 - 前端服务（端口 5173）
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

```bash
# 前端构建
cd app && npm run build

# 后端启动
cd server && node index.js
```

前端构建产物在 `app/dist/`，可部署到任何静态服务器。
