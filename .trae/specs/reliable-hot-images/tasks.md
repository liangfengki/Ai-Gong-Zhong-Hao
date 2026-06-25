# Tasks

- [x] Task 1: 重构 cache.js 支持文件持久化
  - [x] SubTask 1.1: 在 cache.js 中添加 `persistToFile()` 和 `loadFromFile()` 方法，将缓存数据写入 `server/data/cache.json`
  - [x] SubTask 1.2: 修改 `set()` 方法，每次写入后异步持久化到文件
  - [x] SubTask 1.3: 在模块初始化时从文件加载已有缓存
  - [x] SubTask 1.4: 添加降级缓存机制：TTL 过期后数据不立即删除，标记为 stale，额外保留 2 小时
  - [x] SubTask 1.5: 修改 `get()` 方法，新增 `getWithStale()` 返回数据和新鲜度标识

- [x] Task 2: 重构 hotCrawler.js 多源可靠性
  - [x] SubTask 2.1: 扩充远程 DailyHotApi 源列表，增加更多公共实例
  - [x] SubTask 2.2: 优化 `fetchHotData()` 函数，改进错误处理和超时策略（每个源超时 8 秒）
  - [x] SubTask 2.3: 优化直接爬取方法，更新 User-Agent 和请求头，增加重试机制
  - [x] SubTask 2.4: 更新 mock 数据中的年份为 2026 年相关内容，增加 mock 数据条目数

- [x] Task 3: 重构 routes/hot.js 使用新缓存机制
  - [x] SubTask 3.1: 修改 `getHotSource()` 使用 `getWithStale()` 获取缓存，优先返回新鲜数据
  - [x] SubTask 3.2: 当返回 stale 缓存数据时，在响应中标记 `stale: true`
  - [x] SubTask 3.3: 当返回 mock 数据时，在响应中标记 `mock: true`

- [x] Task 4: 重构 routes/images.js 支持免费图片搜索
  - [x] SubTask 4.1: 新增 Loremflickr 作为免费图片搜索源（`https://loremflickr.com/{width}/{height}/{keyword}`）
  - [x] SubTask 4.2: 修改三个搜索路由的无 Key 回退逻辑：API Key > Loremflickr > Picsum
  - [x] SubTask 4.3: 扩展 img-proxy 白名单，增加 `loremflickr.com`、`lorem.space` 域名
  - [x] SubTask 4.4: 确保前端 API 响应格式兼容（Unsplash/Pexels/Pixabay 格式不变）

- [x] Task 5: 更新前端热点页面显示数据来源状态
  - [x] SubTask 5.1: 在 HotTopicsPage 中根据响应的 `cached`/`stale`/`mock` 字段显示数据来源标识
  - [x] SubTask 5.2: 当数据为 stale 或 mock 时，在页面顶部显示提示 Banner

- [x] Task 6: 更新前端图片页面改善无 Key 体验
  - [x] SubTask 6.1: 当使用免费源搜索时，在图片来源区域显示"免费图片源"标识
  - [x] SubTask 6.2: 确保图片预览、复制、下载功能正常工作

# Task Dependencies
- Task 2 依赖 Task 1（hotCrawler 使用新缓存）
- Task 3 依赖 Task 1 和 Task 2
- Task 5 依赖 Task 3
- Task 4、Task 6 与 Task 1-3 可并行
