import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { generateArticleStream, generateImage } from '@/services/api';
import { toast } from 'sonner';

export function useAIGeneration() {
  const { settings } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleGenerate = async (
    prompt: string,
    wordCount: number,
    onChunk: (chunk: string) => void
  ) => {
    setIsGenerating(true);
    try {
      await generateArticleStream(
        prompt,
        wordCount,
        settings.ai.apiKey,
        settings.ai.model,
        onChunk,
        settings.ai.baseUrl
      );
      toast.success('生成完成', { description: '文章已生成，您可以继续编辑' });
    } catch (err) {
      const message = getErrorMessage(err);
      toast.error('生成失败', { description: message });
      throw err; // 重新抛出，让调用方可以恢复内容
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async (imagePrompt: string): Promise<string | null> => {
    if (!imagePrompt.trim()) {
      toast.error('请输入描述', { description: '请描述您想要生成的图片' });
      return null;
    }

    setIsGeneratingImage(true);
    try {
      const imageUrl = await generateImage(
        imagePrompt,
        settings.ai.apiKey,
        '1024x1024',
        settings.ai.baseUrl,
        settings.ai.model
      );
      toast.success('图片生成成功', { description: '图片已插入到文章中' });
      return imageUrl;
    } catch (err) {
      const message = getErrorMessage(err);
      toast.error('图片生成失败', { description: message });
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return { isGenerating, isGeneratingImage, handleGenerate, handleGenerateImage };
}

function getErrorMessage(err: unknown): string {
  if (err instanceof TypeError && err.message.includes('fetch')) {
    return '网络连接失败，请检查网络';
  }
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('invalid')) {
      return 'API Key 无效，请检查设置';
    }
    if (msg.includes('429') || msg.includes('rate') || msg.includes('limit')) {
      return '请求过于频繁，请稍后重试';
    }
    if (msg.includes('timeout') || msg.includes('超时')) {
      return '请求超时，请稍后重试';
    }
    return msg;
  }
  return '请检查API配置是否正确';
}
