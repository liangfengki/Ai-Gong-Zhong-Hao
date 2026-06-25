# Tasks

- [x] Task 1: 服务端配置 — 设置 Agnes AI 默认 API Key 和 Base URL
  - [x] 1.1 在 `server/.env` 中设置 `OPENAI_API_KEY` 为 Agnes API Key，`OPENAI_BASE_URL` 为 `https://apihub.agnes-ai.com/v1`，`DEFAULT_MODEL` 为 `agnes-2.0-flash`
  - [x] 1.2 更新 `server/.env.example` 同步变更
  - [x] 1.3 更新 `server/services/aiService.js` 中 `ALLOWED_BASE_URLS` 确保 `https://apihub.agnes-ai.com` 已在白名单（已有，确认即可）

- [x] Task 2: 服务端图片生成改用 Agnes Image 模型
  - [x] 2.1 修改 `server/services/aiService.js` 的 `generateImage` 函数，将 `model` 从硬编码 `dall-e-3` 改为从 headers/config 获取，默认 `agnes-image-2.0-flash`
  - [x] 2.2 更新 `server/middleware/validation.js` 中 `generateImage` 的 size 验证，增加 Agnes 支持的尺寸 `1024x768`、`768x1024`

- [x] Task 3: 服务端新增视频生成 API
  - [x] 3.1 在 `server/services/aiService.js` 新增 `generateVideo` 函数：POST 到 `{baseUrl}/video/generations` 创建任务
  - [x] 3.2 新增 `getVideoStatus` 函数：GET `{baseUrl}/video/generations/{taskId}` 查询任务状态
  - [x] 3.3 在 `server/routes/ai.js` 新增 `POST /generate-video` 路由（提交任务 + 自动轮询直到完成/超时）
  - [x] 3.4 在 `server/routes/ai.js` 新增 `GET /video-status/:taskId` 路由（供前端手动查询）
  - [x] 3.5 在 `server/middleware/validation.js` 新增 `generateVideo` 验证规则

- [x] Task 4: 前端默认配置改为 Agnes AI
  - [x] 4.1 修改 `app/src/stores/useAppStore.ts` 中 `defaultSettings`，将 `ai.baseUrl` 改为 `https://apihub.agnes-ai.com/v1`，`ai.model` 改为 `agnes-2.0-flash`，`ai.apiKey` 保持空字符串
  - [x] 4.2 在 `types/index.ts` 中新增 `aiModelMode: 'default' | 'custom'` 字段到 `UserSettings`（用于控制设置页 UI 显示模式）

- [x] Task 5: 前端设置页简化默认模式
  - [x] 5.1 修改 `SettingsPage.tsx`：当 `aiModelMode === 'default'` 时，隐藏 API Key / Base URL / 模型选择 / Quick Setup 等配置项，只显示"已启用默认模型 (Agnes AI)"状态卡片 + 测试连接按钮
  - [x] 5.2 添加"切换到自定义模型"按钮，点击后 `aiModelMode` 设为 `custom`，显示完整配置
  - [x] 5.3 自定义模式下保留原有完整配置界面（含提供商预设等）

- [x] Task 6: 前端新增视频生成 API 和 Hook
  - [x] 6.1 在 `app/src/services/api.ts` 新增 `generateVideo(prompt, apiKey, model, baseUrl, image?)` 函数
  - [x] 6.2 在 `app/src/hooks/useAIGeneration.ts` 新增 `handleGenerateVideo` 方法和 `isGeneratingVideo` 状态

- [x] Task 7: 端到端验证
  - [x] 7.1 启动服务端和前端，验证默认模式下文本生成正常
  - [x] 7.2 验证默认模式下图片生成正常
  - [x] 7.3 验证视频生成 API 正常（文生视频）
  - [x] 7.4 验证设置页默认模式/自定义模式切换正常

# Task Dependencies
- Task 1 无依赖
- Task 2 依赖 Task 1
- Task 3 依赖 Task 1
- Task 4 依赖 Task 1
- Task 5 依赖 Task 4
- Task 6 依赖 Task 3
- Task 7 依赖所有前序任务
