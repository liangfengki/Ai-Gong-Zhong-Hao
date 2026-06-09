import { applyStyleToContent, getDefaultStyleTemplate } from '@/lib/formatUtils';
import { toast } from 'sonner';

export function useArticleActions(_title: string, content: string) {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('复制成功', { description: '文章内容已复制到剪贴板' });
  };

  const handleCopyForWechat = () => {
    const template = getDefaultStyleTemplate();
    const styledHtml = applyStyleToContent(content, template);
    const blob = new Blob([styledHtml], { type: 'text/html' });
    const clipboardItem = new ClipboardItem({
      'text/html': blob,
      'text/plain': new Blob([content], { type: 'text/plain' }),
    });
    navigator.clipboard.write([clipboardItem]);
    toast.success('复制成功', { description: '已复制公众号格式，可直接粘贴到公众号编辑器' });
  };

  return { handleCopy, handleCopyForWechat };
}
