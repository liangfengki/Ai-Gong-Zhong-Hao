# ============ Stage 1: 构建前端 ============
FROM node:20-alpine AS frontend-builder

WORKDIR /build/app

COPY app/package*.json ./
RUN npm ci

COPY app/ ./
RUN npm run build

# ============ Stage 2: 运行时 ============
FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server/ ./

# 复制前端构建产物
COPY --from=frontend-builder /build/app/dist ./public

ENV NODE_ENV=production
EXPOSE 6356

CMD ["node", "index.js"]
