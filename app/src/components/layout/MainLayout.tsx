import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

export function MainLayout() {
  const { sidebarOpen } = useAppStore();
  const location = useLocation();

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
