import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { styleTemplates, type StyleTemplate } from '@/lib/styleTemplates';
import { toast } from 'sonner';

interface OneClickFormatProps {
  onApplyStyle: (template: StyleTemplate) => void;
}

export function OneClickFormat({ onApplyStyle }: OneClickFormatProps) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleApply = (template: StyleTemplate) => {
    setSelectedId(template.id);
    onApplyStyle(template);
    toast.success(`已应用「${template.name}」排版风格`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
          <Sparkles className="h-4 w-4" />
          一键排版
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-purple-500" />
            一键排版 - 选择风格
          </DialogTitle>
          <DialogDescription>
            选择一个排版风格后，会立即应用到编辑器当前内容。
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {styleTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                aria-label={`应用${template.name}排版风格`}
                aria-pressed={selectedId === template.id}
                className={`relative rounded-xl border-2 p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  selectedId === template.id
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 shadow-lg'
                    : hoveredId === template.id
                    ? 'border-gray-300 dark:border-gray-600 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleApply(template)}
                onMouseEnter={() => setHoveredId(template.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {selectedId === template.id && (
                  <div className="absolute -top-2 -right-2 rounded-full bg-purple-500 p-1">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                
                {/* 预览色块 */}
                <div
                  className="mb-3 h-16 rounded-lg"
                  style={{
                    background: template.preview,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                />
                
                {/* 标题 */}
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-lg">{template.icon}</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{template.name}</span>
                </div>
                
                {/* 描述 */}
                <p className="text-xs text-gray-500 dark:text-gray-400">{template.description}</p>
                
                {/* 预览样式 */}
                <div className="mt-3 space-y-1">
                  <div
                    className="text-xs font-bold"
                    style={{ color: template.styles.h2.color as string }}
                  >
                    标题样式
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: template.styles.p.color as string }}
                  >
                    正文样式预览...
                  </div>
                  <div
                    className="h-1 rounded-full"
                    style={{
                      background: template.styles.hr.background || template.styles.hr.backgroundColor,
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
        
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            选择风格后，将自动应用到编辑器中的所有内容
          </p>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
