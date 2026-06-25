# Checklist

- [x] `server/.env` 中 Agnes API Key、Base URL、默认模型已正确配置
- [x] `server/.env.example` 已同步更新
- [x] `server/services/aiService.js` 中 `ALLOWED_BASE_URLS` 包含 `https://apihub.agnes-ai.com`
- [x] `server/services/aiService.js` 的 `generateImage` 不再硬编码 `dall-e-3`，使用 Agnes Image 模型
- [x] `server/services/aiService.js` 新增 `generateVideo` 和 `getVideoStatus` 函数
- [x] `server/routes/ai.js` 新增 `POST /generate-video` 路由
- [x] `server/routes/ai.js` 新增 `GET /video-status/:taskId` 路由
- [x] `server/middleware/validation.js` 新增 `generateVideo` 验证和更新的 `generateImage` 尺寸验证
- [x] `app/src/stores/useAppStore.ts` 默认配置为 Agnes AI
- [x] `app/src/types/index.ts` 新增 `aiModelMode` 字段
- [x] `app/src/pages/SettingsPage.tsx` 默认模式下隐藏 API Key/URL/模型，显示"默认模型"状态
- [x] `app/src/pages/SettingsPage.tsx` 可切换到自定义模式
- [x] `app/src/services/api.ts` 新增 `generateVideo` 函数
- [x] `app/src/hooks/useAIGeneration.ts` 新增视频生成 hook
- [x] 文本生成功能在默认模式下正常工作
- [x] 图片生成功能在默认模式下正常工作（使用 Agnes Image 模型）
- [x] 视频生成功能正常工作
- [x] 设置页默认模式/自定义模式切换 UI 正常
