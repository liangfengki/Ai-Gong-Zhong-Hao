import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { HotTopicsPage } from '@/pages/HotTopicsPage';
import { EditorPage } from '@/pages/EditorPage';
import { ArticleListPage } from '@/pages/ArticleListPage';
import { ImageLibraryPage } from '@/pages/ImageLibraryPage';
import { SettingsPage } from '@/pages/SettingsPage';
import './App.css';

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
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
