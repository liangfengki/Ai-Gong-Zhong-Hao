import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import History from '@tiptap/extension-history';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Highlighter,
  Minus,
  Upload,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import './RichTextEditor.css';

export interface RichTextEditorHandle {
  /** 获取 TipTap 编辑器实例 */
  getEditor: () => ReturnType<typeof useEditor>;
  /** 追加内容到编辑器末尾（不经过 React state，不重置光标） */
  appendContent: (html: string) => void;
}

type TiptapEditor = NonNullable<ReturnType<typeof useEditor>>;
type EditorViewLike = {
  dom: HTMLElement;
  destroy: () => void;
  mounted?: boolean;
  __reactSafeDestroyPatched?: boolean;
};

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  placeholder?: string;
  className?: string;
  onEditorReady?: (editor: ReturnType<typeof useEditor>) => void;
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(function RichTextEditor(
  {
    content,
    onChange,
    onSave,
    placeholder = '开始写作...',
    className,
    onEditorReady,
  },
  ref
) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [uploading, setUploading] = useState(0);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const [initialContent] = useState(() => content);
  const isMounted = useRef(true);
  const tiptapEditorRef = useRef<TiptapEditor | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        undoRedo: false, // 禁用内置 undoRedo，使用独立 History 扩展配置深度
        link: false,
        underline: false,
      }),
      History.configure({
        depth: 100,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Heading.configure({
        levels: [1, 2],
      }),
      Highlight.configure({
        multicolor: false,
      }),
      TextStyle,
      Color,
    ],
    content: initialContent,
    onCreate: ({ editor }) => {
      tiptapEditorRef.current = editor;
      const view = editor.view as unknown as EditorViewLike;
      if (view.__reactSafeDestroyPatched) return;
      view.__reactSafeDestroyPatched = true;
      const originalDestroy = view.destroy.bind(view);
      view.destroy = () => {
        try {
          view.mounted = false;
        } catch {
        }
        const dom = view.dom;
        const parent = dom.parentNode as (Node & { removeChild: (child: Node) => Node }) | null;
        if (!parent) {
          originalDestroy();
          return;
        }
        const originalRemoveChild = parent.removeChild.bind(parent);
        try {
          parent.removeChild = (() => dom) as unknown as typeof parent.removeChild;
          originalDestroy();
        } finally {
          parent.removeChild = originalRemoveChild;
        }
      };
    },
    onDestroy: () => {
      tiptapEditorRef.current = null;
    },
    onUpdate: ({ editor }) => {
      isInternalChange.current = true;
      onChange(editor.getHTML());
    },
    editorProps: {
      handleKeyDown: (_view, event) => {
        const isMod = event.metaKey || event.ctrlKey;
        if (!isMod) return false;

        // Ctrl+S: save
        if (event.key === 's') {
          event.preventDefault();
          onSave?.();
          return true;
        }
        // Ctrl+B / Ctrl+I: let Tiptap handle natively (toggleBold / toggleItalic)
        return false;
      },
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if leaving the editor container
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (
      e.clientX <= rect.left ||
      e.clientX >= rect.right ||
      e.clientY <= rect.top ||
      e.clientY >= rect.bottom
    ) {
      setIsDragging(false);
    }
  }, []);

  // 同步外部 content 变化到编辑器（AI生成、模板插入、版本恢复等）
  // 跳过来自编辑器自身的变更（用户输入），避免光标跳动
  // 使用 requestAnimationFrame 延迟同步，避免与 React DOM 提交冲突
  // Track mount state — only set false on actual unmount
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!editor || !content) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    const raf = requestAnimationFrame(() => {
      if (!isMounted.current) return;
      try {
        const currentContent = editor.getHTML();
        if (content !== currentContent) {
          editor.commands.setContent(content, { emitUpdate: false });
        }
      } catch {
        // editor not ready yet
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [content, editor]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (!editor) return;

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));

      if (imageFiles.length === 0) {
        toast.error('请拖入图片文件');
        return;
      }

      setUploadCount(imageFiles.length);
      setUploading(imageFiles.length);

      imageFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          editor
            .chain()
            .focus()
            .setImage({ src: dataUrl, alt: file.name })
            .run();
          setUploading((prev) => {
            const next = prev - 1;
            if (next === 0) {
              toast.success(`已插入 ${imageFiles.length} 张图片`);
              setUploadCount(0);
            }
            return next;
          });
        };
        reader.onerror = () => {
          setUploading((prev) => {
            const next = prev - 1;
            if (next === 0) {
              toast.success(`已插入图片`);
              setUploadCount(0);
            }
            return next;
          });
          toast.error(`图片读取失败: ${file.name}`);
        };
        reader.readAsDataURL(file);
      });
    },
    [editor]
  );

  // 暴露 editor 实例和 appendContent 给父组件
  useImperativeHandle(ref, () => ({
    getEditor: () => editor!,
    appendContent: (html: string) => {
      if (!editor) return;
      // 追加到文档末尾，不经过 React state，不重置光标
      const endPos = editor.state.doc.content.size;
      editor.chain()
        .insertContentAt(endPos, html)
        .focus('end')
        .run();
      // 同步到 React state
      isInternalChange.current = true;
      onChange(editor.getHTML());
    },
  }), [editor, onChange]);

  // 通知父组件 editor 已就绪
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('请输入链接地址:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('请输入图片地址:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div
      ref={editorContainerRef}
      className={cn('wechat-editor', className)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 拖拽上传遮罩 */}
      {isDragging && (
        <div className="editor-drop-overlay">
          <div className="editor-drop-content">
            <Upload className="h-10 w-10" />
            <span className="text-base font-medium">拖放图片到此处</span>
          </div>
        </div>
      )}

      {/* 上传进度提示 */}
      {uploadCount > 0 && uploading > 0 && (
        <div className="editor-upload-progress">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>正在处理图片... ({uploadCount - uploading}/{uploadCount})</span>
        </div>
      )}

      {/* 工具栏 - 微信风格 */}
      <div className="wechat-toolbar">
        <TooltipProvider delayDuration={300}>
          {/* 撤销/重做 */}
          <div className="toolbar-group">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                >
                  <Undo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>撤销</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>重做</TooltipContent>
            </Tooltip>
          </div>

          <div className="toolbar-divider" />

          {/* 标题 */}
          <div className="toolbar-group">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={editor.isActive('heading', { level: 1 }) ? 'active' : ''}
                >
                  <Heading1 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>大标题</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
                >
                  <Heading2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>小标题</TooltipContent>
            </Tooltip>
          </div>

          <div className="toolbar-divider" />

          {/* 文字格式 */}
          <div className="toolbar-group">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={editor.isActive('bold') ? 'active' : ''}
                >
                  <Bold className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>加粗 <kbd className="ml-1 rounded bg-muted px-1 text-[10px]">Ctrl+B</kbd></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={editor.isActive('italic') ? 'active' : ''}
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>斜体 <kbd className="ml-1 rounded bg-muted px-1 text-[10px]">Ctrl+I</kbd></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className={editor.isActive('underline') ? 'active' : ''}
                >
                  <UnderlineIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>下划线</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={editor.isActive('strike') ? 'active' : ''}
                >
                  <Strikethrough className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>删除线</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHighlight().run()}
                  className={editor.isActive('highlight') ? 'active' : ''}
                >
                  <Highlighter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>高亮</TooltipContent>
            </Tooltip>
          </div>

          <div className="toolbar-divider" />

          {/* 对齐 */}
          <div className="toolbar-group">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().setTextAlign('left').run()}
                  className={editor.isActive({ textAlign: 'left' }) ? 'active' : ''}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>左对齐</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().setTextAlign('center').run()}
                  className={editor.isActive({ textAlign: 'center' }) ? 'active' : ''}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>居中</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().setTextAlign('right').run()}
                  className={editor.isActive({ textAlign: 'right' }) ? 'active' : ''}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>右对齐</TooltipContent>
            </Tooltip>
          </div>

          <div className="toolbar-divider" />

          {/* 列表和引用 */}
          <div className="toolbar-group">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={editor.isActive('bulletList') ? 'active' : ''}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>无序列表</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={editor.isActive('orderedList') ? 'active' : ''}
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>有序列表</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  className={editor.isActive('blockquote') ? 'active' : ''}
                >
                  <Quote className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>引用</TooltipContent>
            </Tooltip>
          </div>

          <div className="toolbar-divider" />

          {/* 插入 */}
          <div className="toolbar-group">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().setHorizontalRule().run()}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>分割线</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addLink}
                  className={editor.isActive('link') ? 'active' : ''}
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>链接</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addImage}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>图片</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* 编辑器内容 */}
      <EditorContent 
        editor={editor} 
        className="wechat-content"
      />
    </div>
  );
});
