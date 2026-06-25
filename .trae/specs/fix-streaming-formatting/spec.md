# 修复 AI 生成文章换行碎片化与排版问题 Spec

## Why
AI 生成的文章在编辑器中显示为"每行两个字"，原因是流式生成时每个 chunk 直接插入编辑器，AI 输出的 `\n` 被 TipTap 解析为 `<br>` 导致段落碎片化。同时 AI 输出的 markdown 语法（`#` 标题、`**` 加粗、`-` 列表等）未被转换为 HTML，排版模板无法正确应用。

## What Changes
- 在流式生成时累积文本 buffer，等完整段落到达后再插入编辑器，避免碎片化换行
- 添加 markdown → HTML 转换层，将 AI 输出的 markdown 语法转为对应 HTML 标签
- 优化 AI prompt，明确要求段落内不换行、输出格式规范

## Impact
- Affected specs: 编辑器内容生成、一键排版
- Affected code:
  - `app/src/pages/EditorPage.tsx` — 流式生成的 onChunk 回调
  - `app/src/components/editor/RichTextEditor.tsx` — appendContent 方法
  - `app/src/services/api.ts` — 流式消费逻辑
  - `app/src/lib/formatUtils.ts` — 可能需要新增 markdown 转换工具

## ADDED Requirements

### Requirement: 流式内容缓冲
系统 SHALL 在流式接收 AI 生成内容时累积到 buffer，只在遇到段落分隔（`\n\n`）或 buffer 达到一定大小时才将完整内容插入编辑器，避免逐 token 插入导致的碎片化。

#### Scenario: AI 流式输出完整段落
- **WHEN** AI 流式返回包含 `\n\n` 的文本
- **THEN** 编辑器按完整段落插入，而非逐字符换行

#### Scenario: AI 输出连续短行
- **WHEN** AI 输出每句话后跟 `\n`（非 `\n\n`）
- **THEN** 单个 `\n` 在段落内被忽略或转为合理空格，不产生 `<br>` 换行

### Requirement: Markdown 转 HTML
系统 SHALL 在将 AI 输出插入编辑器前，将 markdown 语法转换为 HTML 标签：
- `# 标题` → `<h1>标题</h1>`（支持 h1-h3）
- `**加粗**` → `<strong>加粗</strong>`
- `*斜体*` → `<em>斜体</em>`
- `- 列表项` → `<ul><li>列表项</li></ul>`
- `1. 有序列表` → `<ol><li>有序列表</li></ol>`
- `> 引用` → `<blockquote>引用</blockquote>`
- 段落之间 → `<p>段落</p>`

#### Scenario: AI 输出 markdown 格式文章
- **WHEN** AI 返回包含 `# 标题`、`**加粗**` 等 markdown 语法的文本
- **THEN** 编辑器中显示为对应的 HTML 格式化内容（标题、加粗等）

### Requirement: 优化 AI Prompt
系统 SHALL 在发送给 AI 的 prompt 中明确指示输出格式要求：段落为连续文字不换行、段落之间空行分隔、使用 markdown 格式。

#### Scenario: 生成指令包含格式要求
- **WHEN** 用户点击"生成文章"
- **THEN** prompt 中包含明确的输出格式指令

## MODIFIED Requirements
（无）

## REMOVED Requirements
（无）
