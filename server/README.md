# AI公众号写作助手 - 后端服务器

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，填入你的API Key：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 必填 - OpenAI API Key
OPENAI_API_KEY=sk-your-key-here

# 可选 - 图片API Keys
UNSPLASH_ACCESS_KEY=
PEXELS_API_KEY=
PIXABAY_API_KEY=
```

### 3. 启动服务器

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务器默认运行在 `http://localhost:6356`

## API文档

### 热点API

| 接口 | 说明 |
|------|------|
| `GET /baidu/hot` | 百度热搜 |
| `GET /weibo/hot` | 微博热搜 |
| `GET /douyin/hot` | 抖音热搜 |
| `GET /zhihu/hot` | 知乎热榜 |
| `GET /toutiao/hot` | 头条热榜 |
| `GET /bilibili/hot` | B站热榜 |

### 图片API

| 接口 | 参数 | 说明 |
|------|------|------|
| `GET /unsplash/search` | query, page, per_page, orientation | Unsplash搜索 |
| `GET /pexels/search` | query, page, per_page, orientation | Pexels搜索 |
| `GET /pixabay/search` | q, page, per_page | Pixabay搜索 |

### AI API

| 接口 | 方法 | 说明 |
|------|------|------|
| `POST /ai/generate` | POST | AI生成文章 |
| `POST /ai/generate/stream` | POST | AI流式生成 |
| `POST /ai/generate-image` | POST | AI生成图片 |

## 获取API Key

### OpenAI API Key (必填)

1. 访问 https://platform.openai.com
2. 注册/登录
3. 进入 API Keys 页面
4. 创建新的 API Key
5. 复制到 `.env` 文件

### Unsplash API Key (可选)

1. 访问 https://unsplash.com/developers
2. 注册/创建应用
3. 获取 Access Key
4. 复制到 `.env` 文件

### Pexels API Key (可选)

1. 访问 https://www.pexels.com/api/
2. 注册/获取API Key
3. 复制到 `.env` 文件

### Pixabay API Key (可选)

1. 访问 https://pixabay.com/api/docs/
2. 注册/获取API Key
3. 复制到 `.env` 文件

## 模拟数据

如果某些API未配置，服务器会返回模拟数据，方便开发测试。
