import { useState, useRef } from 'react';
import { 
  Eye, 
  Copy, 
  Download,
  Check,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { styleTemplates, type StyleTemplate } from '@/lib/styleTemplates';
import { applyStyleToContent } from '@/lib/formatUtils';
import { OneClickFormat } from './OneClickFormat';
import { TemplateEditor } from './TemplateEditor';

interface FormattingPanelProps {
  content: string;
  onApplyFormat: (formattedHtml: string) => void;
}

export function FormattingPanel({ content, onApplyFormat }: FormattingPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<StyleTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [copied, setCopied] = useState(false);
  const previousContentRef = useRef<string | null>(null);

  // 应用排版模板
  const handleApplyTemplate = (template: StyleTemplate) => {
    if (!content.trim()) {
      toast.error('请先输入文章内容');
      return;
    }

    // 保存快照供撤销
    previousContentRef.current = content;
    setSelectedTemplate(template);

    // 转换为带样式的HTML
    const styledHtml = applyStyleToContent(content, template);
    onApplyFormat(styledHtml);

    toast.success(`已应用「${template.name}」排版风格`, {
      action: {
        label: '撤销',
        onClick: () => {
          if (previousContentRef.current) {
            onApplyFormat(previousContentRef.current);
            previousContentRef.current = null;
            toast.success('已撤销排版');
          }
        },
      },
    });
  };

  // 预览排版效果
  const handlePreview = (template: StyleTemplate) => {
    if (!content.trim()) {
      toast.error('请先输入文章内容');
      return;
    }

    const styledHtml = applyStyleToContent(content, template);
    setPreviewHtml(styledHtml);
    setShowPreview(true);
  };

  // 复制公众号格式
  const handleCopyForWechat = () => {
    if (!content.trim()) {
      toast.error('请先输入文章内容');
      return;
    }

    const template = selectedTemplate || styleTemplates[0];
    const styledHtml = applyStyleToContent(content, template);
    
    // 复制到剪贴板
    const blob = new Blob([styledHtml], { type: 'text/html' });
    const clipboardItem = new ClipboardItem({
      'text/html': blob,
      'text/plain': new Blob([content], { type: 'text/plain' }),
    });
    
    navigator.clipboard.write([clipboardItem]).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('已复制公众号格式，可直接粘贴到公众号编辑器');
    }).catch(() => {
      toast.error('复制失败，请手动复制');
    });
  };

  // 下载HTML文件
  const handleDownloadHtml = () => {
    if (!content.trim()) {
      toast.error('请先输入文章内容');
      return;
    }

    const template = selectedTemplate || styleTemplates[0];
    const styledHtml = applyStyleToContent(content, template);
    
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>公众号文章</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 375px;
      margin: 0 auto;
      background-color: #fff;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    ${styledHtml}
  </div>
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
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4" />
          一键排版
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 排版按钮组 */}
        <div className="flex gap-2">
          <OneClickFormat onApplyStyle={handleApplyTemplate} />
          <TemplateEditor onSave={handleApplyTemplate} />
        </div>

        {/* 当前风格 */}
        {selectedTemplate && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-lg">{selectedTemplate.icon}</span>
            <div>
              <p className="text-sm font-medium">{selectedTemplate.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{selectedTemplate.description}</p>
            </div>
          </div>
        )}

        {/* 快速选择 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">快速选择</h4>
          <div className="flex flex-wrap gap-2">
            {styleTemplates.slice(0, 4).map(template => (
              <Button
                key={template.id}
                variant={selectedTemplate?.id === template.id ? "default" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => handleApplyTemplate(template)}
              >
                <span className="mr-1">{template.icon}</span>
                {template.name}
              </Button>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">操作</h4>
          <div className="grid grid-cols-2 gap-2">
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    const template = selectedTemplate || styleTemplates[0];
                    handlePreview(template);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  预览效果
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>公众号预览</DialogTitle>
                </DialogHeader>
                <div 
                  className="border rounded-lg p-4 max-h-[60vh] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </DialogContent>
            </Dialog>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleCopyForWechat}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  复制到公众号
                </>
              )}
            </Button>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleDownloadHtml}
          >
            <Download className="mr-2 h-4 w-4" />
            下载HTML文件
          </Button>
        </div>

        {/* 使用提示 */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>使用提示：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>点击「一键排版」选择喜欢的风格</li>
            <li>选择后文章将自动应用对应样式</li>
            <li>点击"复制到公众号"可直接粘贴到微信公众号编辑器</li>
            <li>点击"预览效果"可查看在手机上的显示效果</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
