import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PenTool,
  Image,
  Settings,
  Sparkles,
  Newspaper,
  Rss,
  Github,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Flame,
  FileText,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const menuItems = [
  {
    title: '工作台',
    icon: LayoutDashboard,
    path: '/',
    description: '数据概览和快捷入口',
  },
  {
    title: '热点趋势',
    icon: Flame,
    path: '/topics',
    description: '查看各平台热点',
  },
  {
    title: '文章编辑',
    icon: PenTool,
    path: '/editor',
    description: '创建和编辑文章',
  },
  {
    title: '文章管理',
    icon: FileText,
    path: '/articles',
    description: '管理所有文章',
  },
  {
    title: '图片素材',
    icon: Image,
    path: '/images',
    description: '免费图片库',
  },
  {
    title: '设置',
    icon: Settings,
    path: '/settings',
    description: '配置API和模板',
  },
];

const skillItems = [
  { id: 'remove-ai-style', name: '去AI味', icon: Sparkles },
  { id: 'news-summary', name: '新闻摘要', icon: Newspaper },
  { id: 'blog-monitor', name: '博客监控', icon: Rss },
  { id: 'github-trending', name: 'GitHub趋势', icon: Github },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar, settings, toggleDarkMode, toggleFollowSystemTheme } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Apply dark mode on mount and listen for system changes
  useEffect(() => {
    if (settings.followSystemTheme) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const applySystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
        const isDark = e.matches;
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        // Sync store without triggering follow logic again
        useAppStore.setState((state) => ({
          settings: { ...state.settings, darkMode: isDark },
        }));
      };
      applySystemTheme(mediaQuery);
      mediaQuery.addEventListener('change', applySystemTheme);
      return () => mediaQuery.removeEventListener('change', applySystemTheme);
    } else {
      if (settings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings.darkMode, settings.followSystemTheme]);

  // Close mobile sidebar on route change
  useEffect(() => {
    const id = window.setTimeout(() => setMobileOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [location.pathname]);

  return (
    <>
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden h-10 w-10"
        aria-label={mobileOpen ? '关闭导航菜单' : '打开导航菜单'}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300',
          'hidden md:block',
          sidebarOpen ? 'md:w-64' : 'md:w-16',
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">AI写作</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={settings.followSystemTheme ? toggleFollowSystemTheme : toggleDarkMode}
                className="h-8 w-8"
                aria-label={
                  settings.followSystemTheme
                    ? '关闭跟随系统主题'
                    : settings.darkMode
                    ? '切换到亮色模式'
                    : '切换到暗色模式'
                }
                title={
                  settings.followSystemTheme
                    ? '跟随系统主题（点击关闭）'
                    : settings.darkMode
                    ? '切换到亮色模式'
                    : '切换到暗色模式'
                }
              >
                {settings.followSystemTheme ? (
                  <Monitor className="h-4 w-4" />
                ) : settings.darkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              {!settings.followSystemTheme && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFollowSystemTheme}
                  className="h-8 w-8"
                  aria-label="跟随系统主题"
                  title="跟随系统主题"
                >
                  <Monitor className="h-3.5 w-3.5 opacity-60" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="hidden md:flex h-8 w-8"
                aria-label={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}
              >
                {sidebarOpen ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Main Menu */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent',
                      isActive && 'bg-accent font-medium text-accent-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {sidebarOpen && (
                      <div className="flex-1 truncate">{item.title}</div>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Skills Section */}
            {sidebarOpen && (
              <>
                <Separator className="my-4" />
                <div className="mb-2 px-3 text-xs font-medium text-muted-foreground">
                  内置技能
                </div>
                <nav className="space-y-1">
                  {skillItems.map((skill) => {
                    const Icon = skill.icon;
                    const isEnabled = settings.skills.find(s => s.id === skill.id)?.enabled;

                    return (
                      <div
                        key={skill.id}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex-1 truncate">{skill.name}</div>
                        <Badge variant={isEnabled ? 'default' : 'secondary'} className="text-xs">
                          {isEnabled ? '已启用' : '未启用'}
                        </Badge>
                      </div>
                    );
                  })}
                </nav>
              </>
            )}
          </ScrollArea>

          {/* Footer */}
          {sidebarOpen && (
            <div className="border-t p-4">
              <div className="text-xs text-muted-foreground">
                公众号AI写作平台 v1.0
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card transition-transform duration-300 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">AI写作</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={settings.followSystemTheme ? toggleFollowSystemTheme : toggleDarkMode}
                className="h-8 w-8"
                aria-label={
                  settings.followSystemTheme
                    ? '关闭跟随系统主题'
                    : settings.darkMode
                    ? '切换到亮色模式'
                    : '切换到暗色模式'
                }
                title={
                  settings.followSystemTheme
                    ? '跟随系统主题（点击关闭）'
                    : settings.darkMode
                    ? '切换到亮色模式'
                    : '切换到暗色模式'
                }
              >
                {settings.followSystemTheme ? (
                  <Monitor className="h-4 w-4" />
                ) : settings.darkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              {!settings.followSystemTheme && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFollowSystemTheme}
                  className="h-8 w-8"
                  aria-label="跟随系统主题"
                  title="跟随系统主题"
                >
                  <Monitor className="h-3.5 w-3.5 opacity-60" />
                </Button>
              )}
            </div>
          </div>

          {/* Main Menu */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent',
                      isActive && 'bg-accent font-medium text-accent-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <div className="flex-1">{item.title}</div>
                  </Link>
                );
              })}
            </nav>

            <Separator className="my-4" />
            <div className="mb-2 px-3 text-xs font-medium text-muted-foreground">
              内置技能
            </div>
            <nav className="space-y-1">
              {skillItems.map((skill) => {
                const Icon = skill.icon;
                const isEnabled = settings.skills.find(s => s.id === skill.id)?.enabled;

                return (
                  <div
                    key={skill.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1">{skill.name}</div>
                    <Badge variant={isEnabled ? 'default' : 'secondary'} className="text-xs">
                      {isEnabled ? '已启用' : '未启用'}
                    </Badge>
                  </div>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="text-xs text-muted-foreground">
              公众号AI写作平台 v1.0
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
