import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Copy,
  Download,
  Check,
  Sparkles,
  Clock,
  Undo2,
  Palette,
  RotateCcw,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { SafeHtml } from '@/components/ui/safe-html';
import {
  styleTemplates,
  type StyleTemplate,
  type TemplateCategory,
} from '@/lib/styleTemplates';
import { applyStyleToContent } from '@/lib/formatUtils';
import { TemplateEditor } from './TemplateEditor';

const LAST_USED_KEY = 'formatting-last-used-template';
const CATEGORIES: { key: TemplateCategory | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: '简约', label: '简约' },
  { key: '文艺', label: '文艺' },
  { key: '商务', label: '商务' },
  { key: '国潮', label: '国潮' },
  { key: '创意', label: '创意' },
  { key: '科技', label: '科技' },
];

interface FormattingPanelProps {
  content: string;
  onApplyFormat: (formattedHtml: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Template Preview Card                                              */
/* ------------------------------------------------------------------ */

function TemplatePreviewCard({
  template,
  isActive,
  onApply,
  onHoverStart,
  onHoverEnd,
}: {
  template: StyleTemplate;
  isActive: boolean;
  onApply: (t: StyleTemplate) => void;
  onHoverStart: (t: StyleTemplate) => void;
  onHoverEnd: () => void;
}) {
  const accent = template.preview;
  // Derive a lighter tint from the accent for the card background
  const bgTint = accent + '10';

  return (
    <button
      type="button"
      onClick={() => onApply(template)}
      onMouseEnter={() => onHoverStart(template)}
      onMouseLeave={onHoverEnd}
      className={`
        group relative flex flex-col overflow-hidden rounded-xl border-2
        text-left transition-all duration-200
        ${
          isActive
            ? 'border-primary ring-2 ring-primary/20 shadow-lg scale-[1.02]'
            : 'border-border hover:border-muted-foreground/40 hover:shadow-md'
        }
      `}
    >
      {/* Thumbnail preview */}
      <div
        className="relative h-28 w-full overflow-hidden px-3 py-2"
        style={{ backgroundColor: bgTint }}
      >
        {/* Decorative heading bar */}
        <div
          className="mb-1.5 h-2.5 w-3/5 rounded-sm"
          style={{ backgroundColor: accent }}
        />
        {/* Fake text lines */}
        <div className="space-y-1">
          <div className="h-1 w-full rounded-sm bg-foreground/10" />
          <div className="h-1 w-11/12 rounded-sm bg-foreground/8" />
          <div className="h-1 w-4/5 rounded-sm bg-foreground/8" />
          <div className="h-1 w-full rounded-sm bg-foreground/10" />
          <div className="h-1 w-9/12 rounded-sm bg-foreground/8" />
        </div>
        {/* Decorative blockquote */}
        <div
          className="mt-1.5 flex items-stretch gap-1.5"
        >
          <div className="w-0.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
          <div className="flex-1 space-y-0.5">
            <div className="h-1 w-full rounded-sm bg-foreground/6" />
            <div className="h-1 w-3/4 rounded-sm bg-foreground/6" />
          </div>
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/40">
          <span className="text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            点击应用
          </span>
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-base leading-none">{template.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">
            {template.name}
          </p>
          <p className="truncate text-[11px] leading-tight text-muted-foreground">
            {template.description}
          </p>
        </div>
        {isActive && (
          <Badge variant="default" className="shrink-0 px-1.5 py-0 text-[10px]">
            当前
          </Badge>
        )}
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Panel                                                         */
/* ------------------------------------------------------------------ */

export function FormattingPanel({ content, onApplyFormat }: FormattingPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<StyleTemplate | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const previousContentRef = useRef<string | null>(null);
  // Content snapshot before hover preview so we can restore it
  const preHoverContentRef = useRef<string | null>(null);

  // Load last used template on mount
  useEffect(() => {
    try {
      const savedId = localStorage.getItem(LAST_USED_KEY);
      if (savedId) {
        const found = styleTemplates.find((t) => t.id === savedId);
        if (found) setSelectedTemplate(found);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist last-used template
  const persistLastUsed = useCallback((template: StyleTemplate) => {
    try {
      localStorage.setItem(LAST_USED_KEY, template.id);
    } catch {
      // ignore
    }
  }, []);

  // Filtered templates by category
  const filteredTemplates = useMemo(() => {
    if (activeCategory === 'all') return styleTemplates;
    return styleTemplates.filter((t) => t.category === activeCategory);
  }, [activeCategory]);

  // ---- Actions ----

  // Apply template permanently
  const handleApplyTemplate = useCallback(
    (template: StyleTemplate) => {
      if (!content.trim()) {
        toast.error('请先输入文章内容');
        return;
      }

      previousContentRef.current = content;
      setSelectedTemplate(template);
      persistLastUsed(template);

      const styledHtml = applyStyleToContent(content, template);
      onApplyFormat(styledHtml);

      toast.success(`已应用「${template.name}」排版风格`, {
        action: {
          label: '撤销',
          onClick: () => {
            if (previousContentRef.current) {
              onApplyFormat(previousContentRef.current);
              previousContentRef.current = null;
              setSelectedTemplate(null);
              toast.success('已撤销排版');
            }
          },
        },
      });
    },
    [content, onApplyFormat, persistLastUsed],
  );

  // Undo current formatting
  const handleUndo = useCallback(() => {
    if (previousContentRef.current) {
      onApplyFormat(previousContentRef.current);
      previousContentRef.current = null;
      setSelectedTemplate(null);
      toast.success('已撤销排版');
    }
  }, [onApplyFormat]);

  // Hover preview: temporarily apply style, restore on leave
  const handleHoverStart = useCallback(
    (template: StyleTemplate) => {
      if (!content.trim()) return;
      // Save the current content before hover modification
      if (preHoverContentRef.current === null) {
        preHoverContentRef.current = content;
      }
      const styledHtml = applyStyleToContent(content, template);
      onApplyFormat(styledHtml);
    },
    [content, onApplyFormat],
  );

  const handleHoverEnd = useCallback(() => {
    // Restore the content that existed before hover
    if (preHoverContentRef.current !== null) {
      onApplyFormat(preHoverContentRef.current);
      preHoverContentRef.current = null;
    }
  }, [onApplyFormat]);

  // Full-screen preview dialog
  const handlePreviewDialog = useCallback(() => {
    if (!content.trim()) {
      toast.error('请先输入文章内容');
      return;
    }
    const template = selectedTemplate || styleTemplates[0];
    const styledHtml = applyStyleToContent(content, template);
    setPreviewHtml(styledHtml);
    setPreviewDialogOpen(true);
  }, [content, selectedTemplate]);

  // Copy for WeChat
  const handleCopyForWechat = useCallback(() => {
    if (!content.trim()) {
      toast.error('请先输入文章内容');
      return;
    }

    const template = selectedTemplate || styleTemplates[0];
    const styledHtml = applyStyleToContent(content, template);

    const blob = new Blob([styledHtml], { type: 'text/html' });
    const clipboardItem = new ClipboardItem({
      'text/html': blob,
      'text/plain': new Blob([content], { type: 'text/plain' }),
    });

    navigator.clipboard
      .write([clipboardItem])
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('已复制公众号格式，可直接粘贴到公众号编辑器');
      })
      .catch(() => {
        toast.error('复制失败，请手动复制');
      });
  }, [content, selectedTemplate]);

  // Download HTML
  const handleDownloadHtml = useCallback(() => {
    if (!content.trim()) {
      toast.error('请先输入文章内容');
      return;
    }

    const template = selectedTemplate || styleTemplates[0];
    const styledHtml = applyStyleToContent(content, template);

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>公众号文章</title>
  <style>
    body { margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 375px; margin: 0 auto; background-color: #fff; box-shadow: 0 0 10px rgba(0,0,0,0.1); padding: 20px; }
  </style>
</head>
<body>
  <div class="container">${styledHtml}</div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '公众号文章.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('HTML文件已下载');
  }, [content, selectedTemplate]);

  const hasContent = content.trim().length > 0;
  const canUndo = previousContentRef.current !== null;

  return (
    <div className="flex flex-col gap-4">
      {/* ============================================================ */}
      {/*  Top action bar: prominent copy button + undo + download     */}
      {/* ============================================================ */}
      <div className="flex flex-col gap-2">
        {/* Primary action: copy to WeChat */}
        <Button
          onClick={handleCopyForWechat}
          disabled={!hasContent}
          className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:from-green-600 hover:to-emerald-700"
          size="lg"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              已复制到剪贴板
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              复制到公众号
            </>
          )}
        </Button>

        {/* Secondary row */}
        <div className="flex gap-2">
          <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={handlePreviewDialog}
                disabled={!hasContent}
              >
                <Sparkles className="h-3.5 w-3.5" />
                手机预览
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>公众号手机预览</DialogTitle>
              </DialogHeader>
              <SafeHtml
                html={previewHtml}
                className="mx-auto max-h-[65vh] max-w-[375px] overflow-y-auto rounded-lg border bg-white p-4 shadow-inner"
              />
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={handleDownloadHtml}
            disabled={!hasContent}
          >
            <Download className="h-3.5 w-3.5" />
            下载 HTML
          </Button>

          {canUndo && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleUndo}
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                    撤销
                  </Button>
                </TooltipTrigger>
                <TooltipContent>撤销上一次排版操作</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Last-used template shortcut                                 */}
      {/* ============================================================ */}
      {selectedTemplate && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2">
          <Clock className="h-3.5 w-3.5 shrink-0 text-primary/60" />
          <span className="text-xs text-muted-foreground">当前风格：</span>
          <span className="text-sm" style={{ color: selectedTemplate.preview }}>
            {selectedTemplate.icon}
          </span>
          <span className="text-sm font-medium">{selectedTemplate.name}</span>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => {
              handleUndo();
            }}
          >
            <RotateCcw className="h-3 w-3" />
            恢复
          </Button>
        </div>
      )}

      {/* ============================================================ */}
      {/*  Template gallery with category tabs                         */}
      {/* ============================================================ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold">选择排版模板</h4>
          </div>
          <TemplateEditor onSave={handleApplyTemplate} />
        </div>

        <p className="text-[11px] text-muted-foreground">
          悬停模板可实时预览效果，点击即可应用
        </p>

        {/* Category tabs */}
        <Tabs
          value={activeCategory}
          onValueChange={(v) => setActiveCategory(v as TemplateCategory | 'all')}
        >
          <TabsList className="flex h-8 w-full flex-wrap justify-start gap-0.5 bg-transparent p-0">
            {CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat.key}
                value={cat.key}
                className="h-7 rounded-md px-2.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORIES.map((cat) => (
            <TabsContent key={cat.key} value={cat.key} className="mt-2">
              <ScrollArea className="max-h-[45vh]">
                <div className="grid grid-cols-2 gap-2 pr-2">
                  {filteredTemplates.map((template) => (
                    <TemplatePreviewCard
                      key={template.id}
                      template={template}
                      isActive={selectedTemplate?.id === template.id}
                      onApply={handleApplyTemplate}
                      onHoverStart={handleHoverStart}
                      onHoverEnd={handleHoverEnd}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* ============================================================ */}
      {/*  Quick tips                                                  */}
      {/* ============================================================ */}
      <div className="rounded-lg bg-muted/40 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        <div className="mb-1 flex items-center gap-1 font-medium text-foreground/70">
          <Heart className="h-3 w-3" />
          使用提示
        </div>
        <ul className="space-y-0.5 pl-4 list-disc">
          <li>悬停在模板卡片上可实时预览排版效果</li>
          <li>点击模板即可永久应用该排版风格</li>
          <li>应用后可随时点击「撤销」恢复原文</li>
          <li>点击「复制到公众号」后直接粘贴到微信编辑器</li>
          <li>上次使用的模板会自动记忆</li>
        </ul>
      </div>
    </div>
  );
}
