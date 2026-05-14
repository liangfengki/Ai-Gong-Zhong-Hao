import { useNavigate } from 'react-router-dom';
import { 
  PenTool, 
  Image, 
  Flame, 
  Settings, 
  Clock, 
  FileText,
  TrendingUp,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/useAppStore';

export function DashboardPage() {
  const navigate = useNavigate();
  const { articles, hotTopics, settings } = useAppStore();

  const recentArticles = articles.slice(0, 5);
  const todayTopics = hotTopics.slice(0, 6);

  const quickActions = [
    {
      title: '写新文章',
      description: '从空白开始创作',
      icon: PenTool,
      path: '/editor',
      color: 'bg-blue-500',
    },
    {
      title: '追热点',
      description: '基于热点生成文章',
      icon: Flame,
      path: '/topics',
      color: 'bg-orange-500',
    },
    {
      title: '找图片',
      description: '免费图片素材库',
      icon: Image,
      path: '/images',
      color: 'bg-green-500',
    },
    {
      title: '系统设置',
      description: '配置AI和模板',
      icon: Settings,
      path: '/settings',
      color: 'bg-gray-500',
    },
  ];

  const stats = [
    { label: '文章总数', value: articles.length, icon: FileText },
    { label: '今日热点', value: hotTopics.length, icon: TrendingUp },
    { label: '已启用技能', value: settings.skills.filter(s => s.enabled).length, icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">👋 欢迎回来</h1>
          <p className="text-muted-foreground">
            AI公众号写作助手，让创作更高效
          </p>
        </div>
        <Button onClick={() => navigate('/editor')}>
          <PenTool className="mr-2 h-4 w-4" />
          开始写作
        </Button>
      </div>

      {/* 数据统计 */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 快捷入口 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">快捷入口</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card 
                key={action.title}
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="p-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${action.color} mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 最近文章 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">最近文章</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/articles')}
            >
              查看全部
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentArticles.length === 0 ? (
              <div className="space-y-4 py-4">
                <div className="text-center mb-4">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">开始你的创作之旅</p>
                </div>
                {[
                  { step: 1, label: '配置 AI 设置', desc: '添加 API Key', path: '/settings', done: !!settings.ai?.apiKey },
                  { step: 2, label: '浏览今日热点', desc: '寻找写作灵感', path: '/topics', done: hotTopics.length > 0 },
                  { step: 3, label: '开始写作', desc: '创建第一篇文章', path: '/editor', done: false },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate(item.path)}
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      item.done ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {item.done ? '✓' : item.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {recentArticles.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
                    onClick={() => navigate('/editor', { state: { articleId: article.id } })}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{article.title || '无标题'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(article.updatedAt).toLocaleDateString()}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {article.wordCount}字
                        </Badge>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 今日热点 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">今日热点</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/topics')}
            >
              查看全部
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {todayTopics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Flame className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">暂无热点数据</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => navigate('/topics')}
                >
                  查看热点
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayTopics.map((topic, index) => (
                  <div
                    key={topic.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                    onClick={() => navigate('/editor', { state: { topic } })}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{topic.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {topic.source}
                        </Badge>
                        {topic.hot > 0 && (
                          <span className="text-xs text-muted-foreground">
                            🔥 {topic.hot > 10000 ? `${(topic.hot / 10000).toFixed(1)}万` : topic.hot}
                          </span>
                        )}
                      </div>
                    </div>
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
