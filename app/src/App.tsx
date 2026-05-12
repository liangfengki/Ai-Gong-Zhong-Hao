import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { MainLayout } from '@/components/layout/MainLayout';
import { Skeleton } from '@/components/ui/skeleton';
import './App.css';

// 代码分割 - 懒加载页面
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const HotTopicsPage = lazy(() => import('@/pages/HotTopicsPage').then(m => ({ default: m.HotTopicsPage })));
const EditorPage = lazy(() => import('@/pages/EditorPage').then(m => ({ default: m.EditorPage })));
const ArticleListPage = lazy(() => import('@/pages/ArticleListPage').then(m => ({ default: m.ArticleListPage })));
const ImageLibraryPage = lazy(() => import('@/pages/ImageLibraryPage').then(m => ({ default: m.ImageLibraryPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

// 加载占位
function PageLoader() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-96" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="topics" element={<HotTopicsPage />} />
              <Route path="editor" element={<EditorPage />} />
              <Route path="articles" element={<ArticleListPage />} />
              <Route path="images" element={<ImageLibraryPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </Suspense>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
