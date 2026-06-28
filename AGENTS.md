# AGENTS.md

公众号 AI 写作平台：用于追踪热点、按领域模板生成公众号文章、配图、编辑和一键排版复制。

## Project Map

| Path | Purpose |
| --- | --- |
| `app/` | React + TypeScript + Vite 前端，端口 `7658`，所有业务请求走 `/api/*`。 |
| `server/` | Express 后端，端口 `6356`，负责热点代理、AI 生成、图片代理、文档 API、缓存和安全中间件。 |
| `dailyhot-api/` | 第三方热点聚合服务，端口 `6688`，独立仓库，除非明确要求不要直接修改。 |
| `spec/` | 产品规格和验收标准。 |
| `start.sh` | 本地一键启动三服务。 |

请求流：`app` → `/api/*` → Vite proxy → `server` → DailyHotApi / AI API / 图片 API / 数据库。

## Commands

```bash
./start.sh

cd app && npm run dev
cd app && npm run build
cd app && npm run lint
cd app && npx vitest run --reporter verbose

cd server && npm run dev
cd server && npm start
```

## Rules

- 不修改 `dailyhot-api/`，除非任务明确要求处理第三方热点服务。
- 前端 API 统一放在 `app/src/services/api.ts`，不要绕过 `/api` 直连后端或外部服务。
- 领域写作模板以内置配置为主：`app/src/lib/domainTemplates.ts`。
- 公众号排版相关 HTML 必须经过安全渲染边界，优先使用 `SafeHtml`。
- 交付前至少运行：`npm run build`、`npm run lint`、`npx vitest run --reporter verbose`。
