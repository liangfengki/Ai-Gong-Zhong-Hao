# 热点趋势 & 图片素材可靠性修复 Spec

## Why
热点趋势和图片素材两个核心功能当前不可用。热点趋势依赖本地 DailyHotApi 服务（localhost:6688），部署到 Railway 后该服务不存在，远程 API 源不稳定，爬取被反爬拦截，最终只能显示假的 mock 数据。图片素材在无 API Key 时回退到 Lorem Picsum（随机图片，不支持关键词搜索），用户无法搜索到有意义的图片。

## What Changes
- 重构 `hotCrawler.js`：移除对本地 DailyHotApi 的强依赖，增加更多可靠的远程热点 API 源，优化直接爬取策略，增加持久化缓存（写入文件）使数据在服务重启后仍可用
- 重构 `routes/images.js`：新增免费图片搜索源（Loremflickr 等无需 API Key 的服务），扩展图片代理白名单，改善无 Key 时的搜索体验
- 更新 `cache.js`：支持文件持久化缓存，热点数据缓存 TTL 从 5 分钟延长到 30 分钟
- 更新前端：热点页面显示数据来源标识（实时/缓存/降级），图片页面在使用免费源时给出提示

## Impact
- Affected specs: 热点趋势功能、图片素材功能
- Affected code: `server/services/hotCrawler.js`, `server/cache.js`, `server/routes/hot.js`, `server/routes/images.js`, `app/src/pages/HotTopicsPage.tsx`, `app/src/pages/ImageLibraryPage.tsx`

## ADDED Requirements

### Requirement: 热点趋势多源可靠获取
系统 SHALL 通过多个独立数据源获取热点数据，不依赖任何单一外部服务。当某个数据源失败时，自动切换到下一个数据源。成功获取的数据 SHALL 被持久化缓存到文件系统，在服务重启后仍可使用。

#### Scenario: 远程 DailyHotApi 可用
- **WHEN** 用户访问热点趋势页面
- **THEN** 系统依次尝试多个远程 DailyHotApi 实例，使用第一个成功返回的数据

#### Scenario: 远程 API 全部失败
- **WHEN** 所有远程 DailyHotApi 实例不可用
- **THEN** 系统尝试直接爬取各平台热搜，使用成功爬取的数据

#### Scenario: 爬取也失败但有缓存
- **WHEN** 实时获取全部失败但文件系统有缓存数据
- **THEN** 返回缓存数据并标记为"缓存数据"

#### Scenario: 全部失败无缓存
- **WHEN** 所有数据源均失败且无任何缓存
- **THEN** 返回 mock 数据并明确标记为"示例数据"

### Requirement: 图片素材免费关键词搜索
系统 SHALL 在无 API Key 配置时，使用免费的关键词搜索图片源（如 Loremflickr），而非仅返回随机图片。

#### Scenario: 无 API Key 时搜索图片
- **WHEN** 用户在图片素材页搜索"风景"
- **THEN** 系统使用免费图片源返回与"风景"相关的图片，而非完全随机的图片

#### Scenario: 有 API Key 时搜索图片
- **WHEN** 配置了 Pexels/Unsplash/Pixabay API Key
- **THEN** 系统使用官方 API 返回高质量搜索结果（行为不变）

#### Scenario: 图片代理支持新源
- **WHEN** 前端请求通过 img-proxy 代理免费源的图片
- **THEN** 代理正确转发请求并返回图片

## MODIFIED Requirements

### Requirement: 缓存策略
缓存 TTL 从 5 分钟延长到 30 分钟，并增加文件持久化。热点数据在缓存过期后仍可作为降级数据使用（额外保留 2 小时）。

## REMOVED Requirements
无
