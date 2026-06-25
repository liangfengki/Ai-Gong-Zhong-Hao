import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import type { Article } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export type SaveStatus = 'saved' | 'unsaved' | 'saving';

export function useAutoSave(title: string, content: string, wordCount: number) {
  const { setCurrentArticle, addArticle, updateArticle } = useAppStore();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSave = useCallback((t: string, c: string, wc: number) => {
    if (!t && !c) return;

    setSaveStatus('saving');
    // 始终从 store 同步获取最新状态，避免时序问题
    const store = useAppStore.getState();
    const current = store.currentArticle;
    const articleId = current?.id || uuidv4();

    const article: Article = {
      id: articleId,
      title: t || '未命名文章',
      content: c,
      wordCount: wc,
      tags: current?.tags || [],
      createdAt: current?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
    };
    setCurrentArticle(article);
    
    // 检查文章是否已存在于列表中
    const existsInList = store.articles.some(a => a.id === articleId);
    if (existsInList) {
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
  }, [setCurrentArticle, addArticle, updateArticle]);

  // Debounce 3s: schedule save on content change
  useEffect(() => {
    if (!title && !content) return;

    setSaveStatus('unsaved');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSave(title, content, wordCount), 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [title, content, wordCount, doSave]);

  // Manual save (immediate, bypasses debounce)
  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    doSave(title, content, wordCount);
  }, [doSave, title, content, wordCount]);

  return { saveStatus, saveNow };
}
