---
name: editor-ui-ux-optimization
overview: 优化AI公众号写作助手的前端UI/UX，重点改进文章编辑区域的视觉体验和交互逻辑
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - 现代简约
    - 专业高效
    - 专注写作
    - 渐进式披露
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 28px
      weight: 700
    subheading:
      size: 18px
      weight: 600
    body:
      size: 15px
      weight: 400
  colorSystem:
    primary:
      - "#2563eb"
      - "#3b82f6"
      - "#60a5fa"
    background:
      - "#ffffff"
      - "#f8fafc"
      - "#f1f5f9"
    text:
      - "#0f172a"
      - "#334155"
      - "#64748b"
    functional:
      - "#22c55e"
      - "#ef4444"
      - "#f59e0b"
todos:
  - id: design-system-setup
    content: 创建.impeccable.md设计上下文文件，定义设计原则和风格指南
    status: completed
  - id: css-variables-upgrade
    content: 扩展index.css设计token，添加编辑器专用色彩和间距变量
    status: completed
    dependencies:
      - design-system-setup
  - id: editor-toolbar-redesign
    content: 使用[skill:Impeccable]优化RichTextEditor工具栏样式，添加毛玻璃效果和分组优化
    status: completed
    dependencies:
      - css-variables-upgrade
  - id: editor-content-area
    content: 优化编辑区域样式，添加纸张质感背景和舒适的阅读体验
    status: completed
    dependencies:
      - css-variables-upgrade
  - id: editor-page-layout
    content: 重构EditorPage.tsx布局，优化顶栏、标签页和状态栏设计
    status: completed
    dependencies:
      - editor-toolbar-redesign
      - editor-content-area
  - id: tab-labels-guidance
    content: 为右侧面板标签页添加文字提示，优化新手引导体验
    status: completed
    dependencies:
      - editor-page-layout
  - id: micro-interactions
    content: 添加微交互动效，包括按钮hover效果、状态变化动画、面板切换过渡
    status: completed
    dependencies:
      - editor-page-layout
  - id: dark-mode-optimization
    content: 优化深色模式适配，检查编辑器、工具栏、侧边栏的深色模式样式
    status: completed
    dependencies:
      - micro-interactions
  - id: icons-upgrade
    content: 使用[skill:lucide-icons]优化编辑器工具栏图标，确保图标一致性和可访问性
    status: completed
    dependencies:
      - dark-mode-optimization
  - id: responsive-testing
    content: 测试响应式布局，确保在不同屏幕尺寸下的良好体验
    status: completed
    dependencies:
      - icons-upgrade
---

## 产品概述

AI公众号写作助手 - 一站式公众号文章创作平台，集成热点追踪、AI生成、图片素材、一键排版。

## 用户需求

全面优化前端网页UI/UX，特别是文章编辑区域，让其更美观更好看更好用，操作逻辑更顺手。

## 设计上下文

- **目标用户**：自媒体新手，需要简单易用的引导
- **品牌个性**：专业、高效、简洁
- **视觉方向**：浅色/深色模式都要，用户可切换
- **无障碍要求**：无特殊要求

## 核心优化点

1. **编辑器视觉升级**：工具栏美化、编辑区域增加视觉引导、拖拽提示优化
2. **操作逻辑优化**：标签页增加文字提示、快捷操作更直观、新手引导
3. **视觉层次提升**：标题区域更醒目、状态栏信息优化、深色模式适配
4. **微交互动效**：按钮hover效果、状态变化动画、流畅过渡

## 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **样式系统**：Tailwind CSS + CSS变量
- **UI组件库**：shadcn/ui (Radix UI)
- **状态管理**：Zustand
- **编辑器**：TipTap (StarterKit + 扩展)
- **图标**：Lucide Icons

## 实现方案

### 1. 设计系统升级

基于shadcn/ui的CSS变量系统，扩展设计token：

- 添加编辑器专用色彩变量
- 优化深色模式配色
- 统一间距和圆角系统

### 2. 编辑器组件重构

**RichTextEditor.css优化**：

- 工具栏：毛玻璃效果、分组优化、hover动效
- 编辑区：纸张质感背景、更舒适的阅读宽度
- 拖拽提示：更醒目的视觉反馈

**EditorPage.tsx优化**：

- 顶栏：标题输入区域扩大、保存状态更醒目
- 标签页：增加文字提示、激活态更明显
- 状态栏：信息精简、进度条美化

### 3. 微交互动效

- 使用Tailwind CSS动画类
- 按钮hover/active状态
- 面板切换过渡
- 保存状态动画

### 4. 深色模式优化

- 检查所有组件的深色模式适配
- 编辑器背景色适配
- 工具栏深色模式样式

## 性能考虑

- CSS变量避免运行时计算
- 动画使用transform/opacity避免重排
- 组件懒加载（右侧面板各Tab内容）

## 设计风格

采用现代简约风格，以专业、高效、简洁为核心，打造舒适的写作体验。

### 设计方向

- **视觉基调**：干净、专注、无干扰的写作环境
- **色彩策略**：中性色为主，强调色点缀，支持浅色/深色双模式
- **排版**：清晰的视觉层次，舒适的阅读宽度和行高
- **交互**：渐进式披露，常用操作一键可达

### 编辑器设计要点

1. **工具栏**：毛玻璃背景、图标分组、hover微动效
2. **编辑区**：纸张质感、舒适的680px阅读宽度、柔和的背景色
3. **侧边栏**：清晰的标签页导航、卡片式内容展示
4. **状态栏**：精简信息、进度可视化

### 新手引导

- 标签页增加文字提示
- 快捷键提示更醒目
- 空状态引导文案

## Agent Extensions

### Impeccable（前端设计工具集）

- **Purpose**: 创建独特、生产级的前端界面设计，避免泛AI审美
- **Expected outcome**: 生成高质量的UI/UX优化代码，包括现代设计、动效、响应式布局
- **使用场景**: 编辑器组件样式优化、微交互动效设计、深色模式适配

### lucide-icons

- **Purpose**: 下载和自定义Lucide图标
- **Expected outcome**: 为编辑器工具栏和功能按钮提供高质量SVG图标
- **使用场景**: 工具栏图标优化、新增功能图标