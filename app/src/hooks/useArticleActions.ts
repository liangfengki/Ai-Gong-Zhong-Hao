import { useAppStore } from '@/stores/useAppStore';
import { applyStyleToContent, getDefaultStyleTemplate } from '@/lib/formatUtils';
import { toast } from 'sonner';
import type { HotTopic, Article } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export function useArticleActions(title: string, content: string, topic?: HotTopic) {
  const { addArticle, updateArticle, currentArticle, setCurrentArticle } = useAppStore();

  const handleSave = () => {
    const article: Article = {
      id: currentArticle?.id || uuidv4(),
      title,
      content,
      wordCount: content.length,
      tags: topic ? [topic.source] : [],
      createdAt: currentArticle?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
    };

    if (currentArticle) {
      updateArticle(currentArticle.id, {
        title,
        content,
        wordCount: content.length,
        tags: article.tags,
        updatedAt: article.updatedAt,
        status: article.status,
      });
    } else {
      addArticle(article);
    }
    setCurrentArticle(article);

    toast.success('保存成功', { description: '文章已保存到本地' });
  };

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

  return { handleSave, handleCopy, handleCopyForWechat };
}
