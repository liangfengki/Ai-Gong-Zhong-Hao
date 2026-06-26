# 修复：编辑器内容在导航到图片素材后丢失

## 问题分析

用户生成文章后，点击"图片素材"导航到图片库，再返回编辑器时，**编辑器内容为空白**（标题还在但正文消失）。

### 根因：两个关联 Bug

**Bug 1 — 编辑器内容丢失（核心问题）**

触发链路：
1. `MainLayout.tsx` 第 20 行使用 `key={location.pathname}`，路由切换时 EditorPage **完全卸载重挂**
2. `useAutoSave.ts` 第 57-59 行的清理函数只 `clearTimeout`，**没有在卸载前保存内容**
3. 如果用户在 3 秒防抖窗口内导航离开，最新内容未写入 Zustand store
4. 返回时 EditorPage 从 store 读取的是**旧数据**，编辑器显示空白

标题之所以还在，是因为标题可能在上一次保存周期已经持久化，或者通过 `location.state` 携带。

**Bug 2 — 图片素材"插入到编辑器"功能失效**

- `ImageLibraryPage` 第 164-177 行通过 `CustomEvent('insertImageToEditor')` 发送图片
- 但此时 EditorPage 已卸载，`RichTextEditor` 的事件监听器已清除
- 事件被丢弃，图片永远不会被插入

---

## 修复方案

### 修改 1：`useAutoSave` — 卸载前立即保存

**文件**：`app/src/hooks/useAutoSave.ts`

**改动**：在 effect 的清理函数中，如果有待保存内容，立即执行 `doSave` 而不是直接丢弃。

```tsx
// 当前代码（第 57-59 行）
return () => {
  if (timerRef.current) clearTimeout(timerRef.current);
};

// 修改为
return () => {
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    // 卸载前立即保存，防止防抖窗口期内的修改丢失
    doSave(title, content, wordCount);
  }
};
```

注意：`doSave` 闭包中的 `title`、`content`、`wordCount` 是最后一次 effect 执行时的值，即最新的。

### 修改 2：`ImageLibraryPage` — 改用 Zustand store 存储待插入图片

**文件**：`app/src/stores/useAppStore.ts`

**改动**：在 store 中添加 `pendingImageInserts` 状态和对应 action。

```tsx
// 接口新增
pendingImageInserts: Array<{ url: string; alt: string }>;
addPendingImageInsert: (image: { url: string; alt: string }) => void;
clearPendingImageInserts: () => void;
```

实现：
- `addPendingImageInsert`：将图片追加到数组
- `clearPendingImageInserts`：清空数组

**文件**：`app/src/pages/ImageLibraryPage.tsx`

**改动**：`handleInsertToEditor` 改为写入 store 而非派发 CustomEvent。

```tsx
// 当前代码
const handleInsertToEditor = (image: ImageAsset) => {
  const event = new CustomEvent('insertImageToEditor', { ... });
  window.dispatchEvent(event);
  toast.success('图片已发送到编辑器', { description: '请切换到编辑器页面查看' });
};

// 修改为
const handleInsertToEditor = (image: ImageAsset) => {
  useAppStore.getState().addPendingImageInsert({ url: image.url, alt: image.alt });
  toast.success('图片已发送到编辑器', { description: '切回编辑器后图片将自动插入' });
};
```

### 修改 3：`RichTextEditor` — 挂载时检查并插入待处理图片

**文件**：`app/src/components/editor/RichTextEditor.tsx`

**改动**：新增一个 `useEffect`，在 editor 就绪时从 store 读取 `pendingImageInserts`，逐个插入图片，然后清空队列。

```tsx
useEffect(() => {
  if (!editor) return;
  const { pendingImageInserts, clearPendingImageInserts } = useAppStore.getState();
  if (pendingImageInserts.length === 0) return;

  // 延迟一帧确保编辑器完全就绪
  requestAnimationFrame(() => {
    pendingImageInserts.forEach(({ url, alt }) => {
      editor.chain().focus().setImage({ src: url, alt: alt || '' }).run();
    });
    clearPendingImageInserts();
  });
}, [editor]);
```

原有的 `CustomEvent` 监听器可以保留作为兼容（或移除，因为已经不需要了）。建议移除以保持代码清洁。

---

## 涉及文件清单

| 文件 | 改动类型 |
|------|----------|
| `app/src/hooks/useAutoSave.ts` | 修改：卸载前保存 |
| `app/src/stores/useAppStore.ts` | 修改：添加 pendingImageInserts 状态 + actions |
| `app/src/pages/ImageLibraryPage.tsx` | 修改：改用 store 存储待插入图片 |
| `app/src/components/editor/RichTextEditor.tsx` | 修改：挂载时消费待插入图片 |

## 验证步骤

1. **验证 Bug 1 修复**：
   - 在编辑器中输入内容 → 不等待 3 秒 → 立即点击"图片素材"导航离开 → 返回编辑器 → 内容应完整保留
2. **验证 Bug 2 修复**：
   - 在图片素材库选择图片 → 点击"插入到编辑器" → 导航回编辑器 → 图片应自动出现在编辑器中
3. **回归测试**：
   - 自动保存功能仍正常工作（3 秒后状态变为"已保存"）
   - 手动保存（Ctrl+S）正常
   - 正常编辑流程不受影响
