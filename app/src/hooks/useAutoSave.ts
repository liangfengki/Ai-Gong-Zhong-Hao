import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import type { Article } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export type SaveStatus = 'saved' | 'unsaved' | 'saving';

export function useAutoSave(title: string, content: string, wordCount: number) {
  const { currentArticle, setCurrentArticle, addArticle, updateArticle } = useAppStore();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ title, content, wordCount });

  // Keep latest values in ref without triggering effect re-run
  latestRef.current = { title, content, wordCount };

  const doSave = useCallback(() => {
    const { title: t, content: c, wordCount: wc } = latestRef.current;
    if (!t && !c) return;

    setSaveStatus('saving');
    const article: Article = {
      id: currentArticle?.id || uuidv4(),
      title: t || '未命名文章',
      content: c,
      wordCount: wc,
      tags: currentArticle?.tags || [],
      createdAt: currentArticle?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
    };
    setCurrentArticle(article);
    if (currentArticle) {
      updateArticle(article.id, {
        title: article.title,
        content: article.content,
        wordCount: article.wordCount,
        updatedAt: article.updatedAt,
      });
    } else {
      addArticle(article);
    }
    setSaveStatus('saved');
  }, [currentArticle, setCurrentArticle, addArticle, updateArticle]);

  // Debounce 3s: schedule save on content change
  useEffect(() => {
    if (!title && !content) return;

    setSaveStatus('unsaved');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [title, content, wordCount, doSave]);

  // Manual save (immediate, bypasses debounce)
  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    doSave();
  }, [doSave]);

  return { saveStatus, saveNow };
}
