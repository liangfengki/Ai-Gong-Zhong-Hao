import { useState } from 'react';
import { Download, FileText, FileType, FileCode, FileImage, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  convertInchesToTwip,
} from 'docx';
import { saveAs } from 'file-saver';

interface ExportDialogProps {
  title: string;
  content: string;
}

function htmlToDocxParagraphs(html: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const processNode = (node: ChildNode): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text, size: 24, font: 'Microsoft YaHei' })],
            spacing: { after: convertInchesToTwip(0.15) },
            indent: { firstLine: convertInchesToTwip(0.3) },
          })
        );
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === 'h1') {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: el.textContent || '', bold: true, size: 36, font: 'Microsoft YaHei' })],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: convertInchesToTwip(0.3), after: convertInchesToTwip(0.15) },
        })
      );
    } else if (tag === 'h2') {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: el.textContent || '', bold: true, size: 30, font: 'Microsoft YaHei' })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: convertInchesToTwip(0.25), after: convertInchesToTwip(0.1) },
        })
      );
    } else if (tag === 'h3') {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: el.textContent || '', bold: true, size: 26, font: 'Microsoft YaHei' })],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: convertInchesToTwip(0.2), after: convertInchesToTwip(0.1) },
        })
      );
    } else if (tag === 'p') {
      const runs: TextRun[] = [];
      processInlineNodes(el, runs);
      if (runs.length > 0) {
        paragraphs.push(
          new Paragraph({
            children: runs,
            spacing: { after: convertInchesToTwip(0.15) },
            indent: { firstLine: convertInchesToTwip(0.3) },
          })
        );
      }
    } else if (tag === 'blockquote') {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: el.textContent || '', italics: true, size: 24, font: 'Microsoft YaHei', color: '666666' })],
          indent: { left: convertInchesToTwip(0.5) },
          spacing: { after: convertInchesToTwip(0.15) },
        })
      );
    } else if (tag === 'ul' || tag === 'ol') {
      el.querySelectorAll(':scope > li').forEach((li, i) => {
        const prefix = tag === 'ol' ? `${i + 1}. ` : '• ';
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: prefix + (li.textContent || ''), size: 24, font: 'Microsoft YaHei' })],
            indent: { left: convertInchesToTwip(0.4) },
            spacing: { after: convertInchesToTwip(0.05) },
          })
        );
      });
    } else if (tag === 'hr') {
      paragraphs.push(
        new Paragraph({
          children: [],
          spacing: { before: convertInchesToTwip(0.2), after: convertInchesToTwip(0.2) },
          border: { bottom: { style: 'single', size: 6, color: 'CCCCCC' } },
        })
      );
    } else if (tag === 'br') {
      paragraphs.push(new Paragraph({ children: [] }));
    } else if (tag === 'div' || tag === 'section' || tag === 'article') {
      node.childNodes.forEach(processNode);
    } else {
      const runs: TextRun[] = [];
      processInlineNodes(node, runs);
      if (runs.length > 0) {
        paragraphs.push(
          new Paragraph({
            children: runs,
            spacing: { after: convertInchesToTwip(0.15) },
            indent: { firstLine: convertInchesToTwip(0.3) },
          })
        );
      }
    }
  };

  const processInlineNodes = (parent: ChildNode, runs: TextRun[]): void => {
    parent.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent || '';
        if (text) {
          runs.push(new TextRun({ text, size: 24, font: 'Microsoft YaHei' }));
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tag = el.tagName.toLowerCase();
        const style: { bold?: boolean; italics?: boolean; underline?: object; color?: string } = {};

        if (tag === 'strong' || tag === 'b') style.bold = true;
        if (tag === 'em' || tag === 'i') style.italics = true;
        if (tag === 'u') style.underline = {};
        if (tag === 'a') style.color = '2563EB';

        const text = el.textContent || '';
        if (text) {
          runs.push(new TextRun({ text, size: 24, font: 'Microsoft YaHei', ...style }));
        }
      }
    });
  };

  tempDiv.childNodes.forEach(processNode);
  return paragraphs;
}

export function ExportDialog({ title, content }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const runOnKeyboard = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  const downloadFile = (filename: string, data: string | Blob, mimeType: string) => {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportMarkdown = () => {
    const plainText = content
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<hr\s*\/?>/gi, '\n---\n')
      .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)')
      .replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const md = `# ${title}\n\n${plainText}`;
    downloadFile(`${title || '文章'}.md`, md, 'text/markdown;charset=utf-8');
    toast.success('已导出为 Markdown');
    setOpen(false);
  };

  const exportHTML = () => {
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; line-height: 1.75; }
h1 { font-size: 28px; margin-bottom: 16px; }
h2 { font-size: 22px; margin-top: 24px; }
p { margin: 12px 0; }
img { max-width: 100%; height: auto; border-radius: 4px; }
blockquote { border-left: 4px solid #ddd; padding-left: 16px; color: #666; margin: 16px 0; }
hr { border: none; border-top: 1px solid #eee; margin: 24px 0; }
</style>
</head>
<body>
<h1>${title}</h1>
${content}
</body>
</html>`;
    downloadFile(`${title || '文章'}.html`, html, 'text/html;charset=utf-8');
    toast.success('已导出为 HTML');
    setOpen(false);
  };

  const exportText = () => {
    const text = content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    downloadFile(`${title || '文章'}.txt`, `${title}\n\n${text}`, 'text/plain;charset=utf-8');
    toast.success('已导出为纯文本');
    setOpen(false);
  };

  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('请允许弹出窗口以导出PDF');
      return;
    }
    printWindow.document.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
@page { margin: 2cm; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.8; font-size: 14px; }
h1 { font-size: 24px; margin-bottom: 20px; text-align: center; }
h2 { font-size: 20px; margin-top: 24px; margin-bottom: 12px; }
h3 { font-size: 16px; margin-top: 20px; margin-bottom: 8px; }
p { margin: 10px 0; text-indent: 2em; }
img { max-width: 100%; height: auto; margin: 16px 0; }
blockquote { border-left: 4px solid #ddd; padding-left: 16px; color: #666; margin: 16px 0; }
hr { border: none; border-top: 1px solid #eee; margin: 24px 0; }
</style>
</head>
<body>
<h1>${title}</h1>
${content}
</body>
</html>`);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
    toast.success('已打开打印窗口，可保存为PDF');
    setOpen(false);
  };

  const exportWord = async () => {
    setExporting('word');
    try {
      const titleParagraph = new Paragraph({
        children: [new TextRun({ text: title, bold: true, size: 36, font: 'Microsoft YaHei' })],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: convertInchesToTwip(0.3) },
      });

      const contentParagraphs = htmlToDocxParagraphs(content);

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: convertInchesToTwip(1),
                  bottom: convertInchesToTwip(1),
                  left: convertInchesToTwip(1.25),
                  right: convertInchesToTwip(1.25),
                },
              },
            },
            children: [titleParagraph, ...contentParagraphs],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${title || '文章'}.docx`);
      toast.success('已导出为 Word 文档');
      setOpen(false);
    } catch (error) {
      console.error('Word export error:', error);
      toast.error('导出 Word 失败，请重试');
    } finally {
      setExporting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Download className="mr-1 h-4 w-4" />
          导出文章
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>导出文章</DialogTitle>
          <DialogDescription>
            将当前文章导出为 Markdown、HTML、PDF、Word 或纯文本。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Card
            role="button"
            tabIndex={0}
            aria-label="导出 Markdown"
            className="cursor-pointer hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={exportMarkdown}
            onKeyDown={(event) => runOnKeyboard(event, exportMarkdown)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <FileCode className="h-8 w-8 text-blue-500" />
              <div>
                <div className="font-medium">Markdown</div>
                <div className="text-sm text-muted-foreground">适合技术博客和笔记软件</div>
              </div>
            </CardContent>
          </Card>
          <Card
            role="button"
            tabIndex={0}
            aria-label="导出 HTML"
            className="cursor-pointer hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={exportHTML}
            onKeyDown={(event) => runOnKeyboard(event, exportHTML)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <FileType className="h-8 w-8 text-orange-500" />
              <div>
                <div className="font-medium">HTML</div>
                <div className="text-sm text-muted-foreground">保留完整排版样式</div>
              </div>
            </CardContent>
          </Card>
          <Card
            role="button"
            tabIndex={0}
            aria-label="导出 PDF"
            className="cursor-pointer hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={exportPDF}
            onKeyDown={(event) => runOnKeyboard(event, exportPDF)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <FileImage className="h-8 w-8 text-red-500" />
              <div>
                <div className="font-medium">PDF</div>
                <div className="text-sm text-muted-foreground">通过打印功能保存为PDF</div>
              </div>
            </CardContent>
          </Card>
          <Card
            role="button"
            tabIndex={exporting === 'word' ? -1 : 0}
            aria-label="导出 Word"
            aria-disabled={exporting === 'word'}
            className={`cursor-pointer hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${exporting === 'word' ? 'opacity-60 pointer-events-none' : ''}`}
            onClick={() => exporting !== 'word' && exportWord()}
            onKeyDown={(event) => exporting !== 'word' && runOnKeyboard(event, exportWord)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <File className="h-8 w-8 text-indigo-500" />
              <div>
                <div className="font-medium">
                  Word {exporting === 'word' && '(导出中...)'}
                </div>
                <div className="text-sm text-muted-foreground">导出为 .docx 文档</div>
              </div>
            </CardContent>
          </Card>
          <Card
            role="button"
            tabIndex={0}
            aria-label="导出纯文本"
            className="cursor-pointer hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={exportText}
            onKeyDown={(event) => runOnKeyboard(event, exportText)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <FileText className="h-8 w-8 text-gray-500" />
              <div>
                <div className="font-medium">纯文本</div>
                <div className="text-sm text-muted-foreground">去除所有格式</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
