import { toast } from 'sonner';

export function useArticleActions(_title: string, content: string) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('复制成功', { description: '文章内容已复制到剪贴板' });
    } catch {
      toast.error('复制失败', { description: '请检查浏览器剪贴板权限后重试' });
    }
  };

  const handleCopyForWechat = async () => {
    if (!content.trim()) {
      toast.error('请先输入文章内容');
      return;
    }

    try {
      if ('ClipboardItem' in window && window.ClipboardItem && navigator.clipboard.write) {
        const blob = new Blob([content], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({
          'text/html': blob,
          'text/plain': new Blob([content], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([clipboardItem]);
      } else {
        await navigator.clipboard.writeText(content);
      }
      toast.success('复制成功', { description: '已复制公众号格式，可直接粘贴到公众号编辑器' });
    } catch {
      toast.error('复制失败', { description: '请检查浏览器剪贴板权限后重试' });
    }
  };

  return { handleCopy, handleCopyForWechat };
}
