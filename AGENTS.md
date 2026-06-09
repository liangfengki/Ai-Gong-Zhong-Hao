# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

公众号 AI 写作平台 — a WeChat Official Account article writing platform with hot topic tracking, AI generation, image library, and one-click formatting.

## Architecture

Three services run together (see `start.sh`):

| Service | Port | Description |
|---------|------|-------------|
| `dailyhot-api/` | 6688 | Third-party hot topic aggregator ([imsyy/DailyHotApi](https://github.com/imsyy/DailyHotApi)). Standalone git repo, don't modify directly. |
| `server/` | 6356 | Express proxy server. Forwards hot topic requests to DailyHotApi, proxies image search (Unsplash/Pexels/Pixabay), and handles AI generation (OpenAI-compatible API). |
| `app/` | 5173 | React frontend (Vite). All API calls go through `/api/*` which Vite proxies to `localhost:6356`. |

**Request flow:** Frontend → `/api/*` → Vite proxy → `server/index.js` → DailyHotApi / external APIs

## Commands

```bash
# Start all three services
./start.sh

# Frontend only (app/)
cd app && npm run dev
cd app && npm run build        # tsc -b && vite build
cd app && npm run lint         # eslint

# Backend only (server/)
cd server && npm run dev       # node --watch index.js
cd server && npm start         # node index.js

# DailyHotApi
cd dailyhot-api && npm run dev
```

## Frontend (app/)

- **Path alias:** `@/` maps to `src/`
- **State:** Zustand store in `stores/useAppStore.ts`, persisted to localStorage as `wechat-writer-storage`
- **Routing:** React Router v7, pages lazy-loaded in `App.tsx`
- **UI:** shadcn/ui components in `components/ui/`, Tailwind CSS
- **Rich text editor:** TipTap (`components/editor/RichTextEditor.tsx`)
- **API layer:** `services/api.ts` — all backend calls go through `/api` prefix
- **Formatting:** `services/formatting.ts` — Markdown-to-WeChat-HTML conversion
- **Types:** `types/index.ts` — `HotTopic`, `Article`, `Document`, `ImageAsset`, `UserSettings`, `ArticleVersion`, etc.
- **Hooks:** `hooks/useAIGeneration.ts` (AI streaming), `hooks/useAutoSave.ts`, `hooks/useArticleActions.ts`, `hooks/useDocumentState.ts` (document CRUD with undo/redo)

### Testing

```bash
cd app && npx vitest run          # run all tests
cd app && npx vitest run --reporter verbose  # verbose output
cd app && npx vitest              # watch mode
```

- **Framework:** Vitest with happy-dom environment
- **Setup:** `src/setup.ts` (imports `@testing-library/jest-dom/vitest`)
- **Config:** `vitest.config.ts` at project root (globals enabled)
- **Mocking:** Use `vi.hoisted()` for module-level mocks (vitest hoists `vi.mock` calls)

## Server (server/)

Single-file Express server (`index.js`). Key patterns:

- **AI config from headers:** Frontend sends `x-api-key`, `x-base-url`, `x-model` headers; server falls back to `.env` values
- **Base URL normalization:** Server auto-appends `/v1` to base URLs if missing
- **Default AI provider:** DeepSeek (`https://api.deepseek.com/v1`, model `deepseek-chat`)
- **Image API fallback:** When no API keys configured, falls back to Lorem Picsum placeholder images
- **Hot topic proxy:** `proxyHotApi()` fetches from DailyHotApi and normalizes the response format

## Environment Variables (server/.env)

See `server/.env.example`. Key ones: `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `DEFAULT_MODEL`, `UNSPLASH_ACCESS_KEY`, `PEXELS_API_KEY`, `PIXABAY_API_KEY`.
