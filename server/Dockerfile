# ============ Stage 1: 构建前端 ============
FROM node:20-alpine AS frontend-builder

WORKDIR /build/app

# 复制依赖文件
COPY app/package*.json ./
RUN npm ci

# 复制源码并构建
COPY app/ ./
RUN npm run build

# ============ Stage 2: 运行时 ============
FROM node:20-alpine

WORKDIR /app

# 复制 server 依赖文件
COPY server/package*.json ./
RUN npm ci --omit=dev

# 复制 server 源码
COPY server/ ./

# 复制前端构建产物到 public/
COPY --from=frontend-builder /build/app/dist ./public

# Railway 注入 PORT 环境变量，默认 6356
ENV NODE_ENV=production
EXPOSE 6356

CMD ["node", "index.js"]
