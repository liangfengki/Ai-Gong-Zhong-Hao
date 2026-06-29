import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { migrateLocalArticles } from '@/services/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function MainLayout() {
  const { sidebarOpen, articles } = useAppStore();
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const migratePromptedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (migratePromptedRef.current) return;

    const migrateKey = `migrated_${user.id}`;
    if (localStorage.getItem(migrateKey)) return;
    if (articles.length === 0) return;

    migratePromptedRef.current = true;

    toast('检测到本地文章', {
      description: `发现 ${articles.length} 篇本地文章，是否上传至云端账号？`,
      duration: 10000,
      action: {
        label: '立即上传',
        onClick: async () => {
          const result = await migrateLocalArticles(
            articles.map((a) => ({ title: a.title, content: a.content }))
          );
          localStorage.setItem(migrateKey, '1');
          toast.success('迁移完成', {
            description: `成功 ${result.migrated} 篇${result.failed ? `，失败 ${result.failed} 篇` : ''}`,
          });
        },
      },
    });
  }, [isAuthenticated, user, articles]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main
        className={cn(
          'transition-all duration-300',
          'ml-0 md:ml-16',
          sidebarOpen && 'md:ml-64'
        )}
      >
        <div className="container mx-auto p-4 md:p-6" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
