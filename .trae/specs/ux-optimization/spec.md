# 用户体验优化 Spec

## Why
用户反馈多个体验问题：排版功能效果差且不能正常使用；快捷操作（去AI味、生成摘要）每次都清空编辑器重新生成，体验不佳；文章智能分析没有调用AI进行深度分析；图片素材需要点击关键词才能看到图片；复制图片到编辑器功能失效。

## What Changes
- 优化排版模板样式系统，提供更美观专业的公众号排版风格
- 改进快捷操作逻辑，支持基于现有内容进行增量优化而非全量重写
- 文章智能分析接入AI API，提供更深度的内容分析建议
- 图片素材页面改为首页直接展示热门图片，无需搜索即可浏览
- 修复图片复制到编辑器的功能，确保复制的图片能正确插入

## Impact
- Affected specs: 一键排版、AI写作、文章分析、图片素材
- Affected code:
  - `app/src/lib/styleTemplates.ts` — 排版模板样式优化
  - `app/src/components/editor/FormattingPanel.tsx` — 排版面板交互优化
  - `app/src/pages/EditorPage.tsx` — 快捷操作逻辑改进
  - `app/src/components/editor/ContentAnalysis.tsx` — 接入AI分析API
  - `app/src/pages/ImageLibraryPage.tsx` — 首页展示热门图片
  - `app/src/components/editor/RichTextEditor.tsx` — 支持粘贴HTML图片
  - `app/src/services/api.ts` — 新增AI分析API
  - `server/routes/ai.js` — 新增文章分析接口

## ADDED Requirements

### Requirement: 首页展示热门图片
系统 SHALL 在图片素材页面首次加载时自动展示热门/推荐图片，用户无需输入关键词搜索即可浏览图片。

#### Scenario: 首次访问图片素材页
- **WHEN** 用户进入图片素材页面
- **THEN** 自动加载并展示热门推荐图片（如风景、科技、美食等分类）
- **AND** 用户可以直接预览、复制、下载这些图片

### Requirement: AI深度文章分析
系统 SHALL 通过AI API对文章进行深度分析，提供内容质量、SEO优化、可读性、情感倾向等多维度分析建议。

#### Scenario: 使用AI分析文章
- **WHEN** 用户点击"智能分析"按钮
- **THEN** 系统调用AI API对文章内容进行分析
- **AND** 返回包含内容质量评分、改进建议、SEO优化建议等结构化分析结果

## MODIFIED Requirements

### Requirement: 快捷操作增量优化
快捷操作（去AI味、生成摘要、续写等）应基于现有内容进行增量处理，而非清空编辑器重新生成。系统应保留原文结构，只对指定部分进行优化。

#### Scenario: 去AI味操作
- **WHEN** 用户选中部分文字或对整篇文章执行"去AI味"
- **THEN** 系统在原文基础上进行润色优化，保留文章结构和核心内容
- **AND** 优化过程不清空编辑器，支持实时预览优化效果

### Requirement: 图片复制到编辑器
图片素材页面复制的图片应能正确插入到文章编辑器中，支持直接粘贴或拖拽方式。

#### Scenario: 复制图片到编辑器
- **WHEN** 用户在图片素材页点击"复制到编辑器"
- **THEN** 图片URL被复制到剪贴板
- **AND** 用户在编辑器中粘贴时，图片自动插入到光标位置

## REMOVED Requirements
无
