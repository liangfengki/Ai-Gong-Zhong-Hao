import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import type { Article } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export type SaveStatus = 'saved' | 'unsaved' | 'saving';

export function useAutoSave(title: string, content: string, wordCount: number) {
  const { currentArticle, setCurrentArticle, addArticle, updateArticle } = useAppStore();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const articleIdRef = useRef<string | undefined>(currentArticle?.id);

  // 使用 useEffect 同步 articleId ref（更符合 React 最佳实践）
  useEffect(() => {
    if (currentArticle?.id && articleIdRef.current !== currentArticle.id) {
      articleIdRef.current = currentArticle.id;
    }
  }, [currentArticle?.id]);

  const doSave = useCallback((t: string, c: string, wc: number) => {
    if (!t && !c) return;

    setSaveStatus('saving');
    // Read currentArticle from store at save time (not from closure)
    const current = useAppStore.getState().currentArticle;
    const articleId = articleIdRef.current || current?.id || uuidv4();
    if (!articleIdRef.current) {
      articleIdRef.current = articleId;
    }
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
    if (current) {
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
