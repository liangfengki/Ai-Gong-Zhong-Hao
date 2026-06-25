# Agnes AI 默认模型集成 Spec

## Why
用户需要手动配置 API Key 和 Base URL 才能使用 AI 功能，门槛较高。需要内置 Agnes AI 作为默认模型提供商，用户无需任何配置即可直接使用文本生成、图片生成、视频生成三大能力。

## What Changes
- 服务端 `server/.env` 内置 Agnes API Key 作为默认配置
- 服务端新增视频生成 API（`POST /api/ai/generate-video`）和视频状态轮询 API（`GET /api/ai/video-status/:taskId`）
- 服务端图片生成改用 Agnes Image 模型（`agnes-image-2.0-flash`），替换 DALL-E 3
- 前端默认配置改为 Agnes AI（baseUrl + model + apiKey 由服务端提供）
- 前端设置页简化：默认模式下只显示"使用默认模型"，隐藏 API Key / Base URL / 模型选择
- 保留"自定义模型"入口，用户可切换到自定义模式使用其他提供商
- 前端新增视频生成功能（API 调用 + Hook + 编辑器集成）
- 完成后需手动验证文本/图片/视频三个 API 均可正常调用

## Impact
- Affected code:
  - `server/.env` — 新增 Agnes API Key
  - `server/.env.example` — 同步更新示例
  - `server/services/aiService.js` — 新增视频生成/轮询逻辑，更新图片生成模型
  - `server/routes/ai.js` — 新增视频相关路由
  - `server/middleware/validation.js` — 新增视频生成验证规则
  - `app/src/stores/useAppStore.ts` — 默认配置改为 Agnes
  - `app/src/services/api.ts` — 新增视频生成 API
  - `app/src/hooks/useAIGeneration.ts` — 新增视频生成 hook
  - `app/src/pages/SettingsPage.tsx` — 简化默认模式 UI
  - `app/src/types/index.ts` — 如需要新增视频相关类型

## ADDED Requirements

### Requirement: 默认模型零配置
系统 SHALL 内置 Agnes AI 作为默认模型提供商，用户打开应用后无需填写任何 API 配置即可使用文本生成和图片生成功能。

#### Scenario: 新用户首次使用
- **WHEN** 用户打开应用（首次或清除 localStorage）
- **THEN** AI 配置自动使用 Agnes AI 默认值（baseUrl=`https://apihub.agnes-ai.com/v1`, model=`agnes-2.0-flash`），apiKey 由服务端环境变量提供

#### Scenario: 默认模式设置页
- **WHEN** 用户进入设置页且当前为默认模式
- **THEN** 只显示"已启用默认模型 (Agnes AI)"提示和"测试连接"按钮，不显示 API Key / Base URL / 模型选择字段
- **AND** 提供"切换到自定义模型"按钮

### Requirement: 视频生成能力
系统 SHALL 支持通过 Agnes AI API 生成视频，包括提交任务和轮询结果。

#### Scenario: 文生视频
- **WHEN** 用户输入视频描述并触发生成
- **THEN** 系统调用 Agnes Video API 创建异步任务
- **AND** 自动轮询任务状态直到完成
- **AND** 返回视频 URL

#### Scenario: 图生视频
- **WHEN** 用户提供参考图片和视频描述
- **THEN** 系统将图片传入 Agnes Video API 生成动画视频

### Requirement: 图片生成使用 Agnes 模型
系统 SHALL 使用 Agnes Image 模型替代 DALL-E 3 进行图片生成。

#### Scenario: 图片生成
- **WHEN** 用户请求生成图片
- **THEN** 系统调用 `POST /v1/images/generations`，使用 `agnes-image-2.0-flash` 模型
- **AND** 返回生成的图片 URL

## MODIFIED Requirements

### Requirement: AI 配置默认值
默认 AI 配置从 DeepSeek 改为 Agnes AI：
- `baseUrl`: `https://apihub.agnes-ai.com/v1`
- `model`: `agnes-2.0-flash`
- `apiKey`: 留空（由服务端提供）

### Requirement: 服务端 AI 配置
`getAIConfig()` 的环境变量默认值从 DeepSeek 改为 Agnes AI。
