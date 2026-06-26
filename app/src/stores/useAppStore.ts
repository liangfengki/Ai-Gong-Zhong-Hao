import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Article, UserSettings, HotTopic, ArticleVersion } from '@/types';

interface AppStore {
  // 文章状态
  articles: Article[];
  currentArticle: Article | null;

  // 热点状态
  hotTopics: HotTopic[];

  // 版本历史
  articleVersions: ArticleVersion[];

  // 设置状态
  settings: UserSettings;

  // UI状态
  sidebarOpen: boolean;

  // 待插入编辑器的图片队列（跨页面传递用，不持久化）
  pendingImageInserts: Array<{ url: string; alt: string }>;
  addPendingImageInsert: (image: { url: string; alt: string }) => void;
  clearPendingImageInserts: () => void;

  // Actions
  setCurrentArticle: (article: Article | null) => void;
  loadArticle: (id: string) => Article | null;
  addArticle: (article: Article) => void;
  updateArticle: (id: string, updates: Partial<Article>) => void;
  deleteArticle: (id: string) => void;

  setHotTopics: (topics: HotTopic[]) => void;
  toggleFavoriteTopic: (topicId: string) => void;

  addArticleVersion: (version: ArticleVersion) => void;
  deleteArticleVersion: (versionId: string) => void;

  updateSettings: (settings: Partial<UserSettings>) => void;
  toggleDarkMode: () => void;
  toggleFollowSystemTheme: () => void;

  toggleSidebar: () => void;

  exportData: () => string;
  importData: (json: string) => { success: boolean; message: string };
}

const defaultSettings: UserSettings = {
  ai: {
    apiKey: '',
    model: 'agnes-2.0-flash',
    baseUrl: 'https://apihub.agnes-ai.com/v1',
    temperature: 0.7,
    maxTokens: 2000,
  },
  templates: [],
  skills: [
    { id: 'remove-ai-style', name: '去AI味', description: '优化AI生成内容，使其更自然', enabled: true, icon: 'sparkles' },
    { id: 'news-summary', name: '新闻摘要', description: '生成新闻摘要', enabled: true, icon: 'newspaper' },
    { id: 'blog-monitor', name: '博客监控', description: '监控博客更新', enabled: true, icon: 'rss' },
    { id: 'github-trending', name: 'GitHub趋势', description: '追踪GitHub AI趋势', enabled: true, icon: 'github' },
  ],
  defaultWordCount: 1500,
  darkMode: false,
  followSystemTheme: false,
  favoriteTopics: [],
  aiModelMode: 'default',
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      articles: [],
      currentArticle: null,
      hotTopics: [],
      articleVersions: [],
      settings: defaultSettings,
      sidebarOpen: true,
      pendingImageInserts: [],

      // Actions
      setCurrentArticle: (article) => set({ currentArticle: article }),

      loadArticle: (id) => {
        const found = get().articles.find((a) => a.id === id) ?? null;
        if (found) {
          set({ currentArticle: found });
        }
        return found;
      },

      addArticle: (article) => set((state) => ({
        articles: [article, ...state.articles],
      })),

      updateArticle: (id, updates) => set((state) => ({
        articles: state.articles.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
        currentArticle: state.currentArticle?.id === id
          ? { ...state.currentArticle, ...updates }
          : state.currentArticle,
      })),

      deleteArticle: (id) => set((state) => ({
        articles: state.articles.filter((a) => a.id !== id),
        currentArticle: state.currentArticle?.id === id ? null : state.currentArticle,
        articleVersions: state.articleVersions.filter((v) => v.articleId !== id),
      })),

      setHotTopics: (topics) => set({ hotTopics: topics }),

      toggleFavoriteTopic: (topicId) => set((state) => {
        const favs = state.settings.favoriteTopics;
        const isFav = favs.includes(topicId);
        return {
          settings: {
            ...state.settings,
            favoriteTopics: isFav
              ? favs.filter((id) => id !== topicId)
              : [...favs, topicId],
          },
        };
      }),

      addArticleVersion: (version) => set((state) => {
        const otherVersions = state.articleVersions.filter((v) => v.articleId !== version.articleId);
        const thisVersions = state.articleVersions.filter((v) => v.articleId === version.articleId);
        const updated = [version, ...thisVersions].slice(0, 20);
        return { articleVersions: [...otherVersions, ...updated] };
      }),

      deleteArticleVersion: (versionId) => set((state) => ({
        articleVersions: state.articleVersions.filter((v) => v.id !== versionId),
      })),

      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
      })),

      toggleDarkMode: () => set((state) => {
        const newDarkMode = !state.settings.darkMode;
        // 检查是否在浏览器环境中
        if (typeof window !== 'undefined') {
          if (newDarkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        return {
          settings: { ...state.settings, darkMode: newDarkMode },
        };
      }),

      toggleFollowSystemTheme: () => set((state) => {
        const newFollow = !state.settings.followSystemTheme;
        if (newFollow) {
          // 检查是否在浏览器环境中
          if (typeof window !== 'undefined') {
            // Immediately apply system preference
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (systemDark) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
            return {
              settings: { ...state.settings, followSystemTheme: true, darkMode: systemDark },
            };
          }
        }
        return {
          settings: { ...state.settings, followSystemTheme: false },
        };
      }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      addPendingImageInsert: (image) => set((state) => ({
        pendingImageInserts: [...state.pendingImageInserts, image],
      })),

      clearPendingImageInserts: () => set({ pendingImageInserts: [] }),

      exportData: () => {
        const state = get();
        const data = {
          version: 1,
          exportedAt: new Date().toISOString(),
          articles: state.articles,
          articleVersions: state.articleVersions,
          settings: state.settings,
        };
        return JSON.stringify(data, null, 2);
      },

      importData: (json: string) => {
        try {
          const data = JSON.parse(json);
          if (!data.version || !data.articles || !Array.isArray(data.articles)) {
            return { success: false, message: '无效的备份文件格式' };
          }

          set((state) => {
            const existingIds = new Set(state.articles.map((a) => a.id));
            const newArticles = data.articles.filter((a: Article) => !existingIds.has(a.id));
            const mergedArticles = [
              ...state.articles.map((existing) => {
                const imported = data.articles.find((a: Article) => a.id === existing.id);
                return imported && new Date(imported.updatedAt) > new Date(existing.updatedAt)
                  ? imported
                  : existing;
              }),
              ...newArticles,
            ];

            const existingVersionIds = new Set(state.articleVersions.map((v) => v.id));
            const newVersions = (data.articleVersions || []).filter(
              (v: ArticleVersion) => !existingVersionIds.has(v.id)
            );

            return {
              articles: mergedArticles,
              articleVersions: [...state.articleVersions, ...newVersions],
            };
          });

          const count = data.articles.length;
          return { success: true, message: `成功导入 ${count} 篇文章` };
        } catch {
          return { success: false, message: '文件解析失败，请确认是有效的JSON文件' };
        }
      },
    }),
    {
      name: 'wechat-writer-storage',
      partialize: (state) => ({
        articles: state.articles,
        currentArticle: state.currentArticle,
        settings: state.settings,
        articleVersions: state.articleVersions,
      }),
      storage: createJSONStorage(() => ({
        getItem: (name: string) => {
          try {
            return localStorage.getItem(name);
          } catch (e) {
            console.error('[Store] localStorage 读取失败:', e);
            return null;
          }
        },
        setItem: (name: string, value: string) => {
          try {
            localStorage.setItem(name, value);
          } catch (e) {
            console.error('[Store] localStorage 写入失败:', e);
            if (e instanceof DOMException && e.name === 'QuotaExceededError') {
              console.error('[Store] localStorage 容量已满！建议清理旧文章或导出备份。');
              // 尝试清理旧版本历史以释放空间
              try {
                const stored = JSON.parse(localStorage.getItem(name) || '{}');
                if (stored.state?.articleVersions?.length > 5) {
                  stored.state.articleVersions = stored.state.articleVersions.slice(0, 5);
                  localStorage.setItem(name, JSON.stringify(stored));
                  console.warn('[Store] 已自动清理版本历史以释放空间');
                }
              } catch {
                // 清理失败，忽略
              }
            }
          }
        },
        removeItem: (name: string) => {
          try {
            localStorage.removeItem(name);
          } catch {
            // ignore
          }
        },
      })),
    }
  )
);
