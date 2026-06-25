# Tasks

- [ ] Task 1: 实现 markdown → HTML 转换工具函数
  - [ ] SubTask 1.1: 在 `app/src/lib/formatUtils.ts` 中新增 `markdownToHtml(md: string): string` 函数，支持标题、加粗、斜体、列表、引用、段落等基本 markdown 语法转换
  - [ ] SubTask 1.2: 编写单元测试验证转换正确性

- [ ] Task 2: 实现流式内容缓冲机制
  - [ ] SubTask 2.1: 修改 `EditorPage.tsx` 的 `onGenerate` 逻辑，在 onChunk 回调中累积文本到 buffer
  - [ ] SubTask 2.2: buffer 遇到 `\n\n`（段落分隔）时，将 buffer 内容通过 `markdownToHtml` 转换后调用 `appendContent` 插入编辑器
  - [ ] SubTask 2.3: 流结束时 flush 剩余 buffer
  - [ ] SubTask 2.4: 处理 AI 改写（onRefineContent）的流式逻辑，使用相同的缓冲和转换机制

- [ ] Task 3: 优化 AI Prompt 格式指令
  - [ ] SubTask 3.1: 修改 `EditorPage.tsx` 中 `onGenerateRef.current` 的 prompt，增加 markdown 输出格式要求
  - [ ] SubTask 3.2: 修改 `onRefineContent` 的 prompt，同样增加格式要求

# Task Dependencies
- Task 2 依赖 Task 1（缓冲机制需要调用 markdownToHtml）
- Task 3 独立，可与 Task 1 并行
