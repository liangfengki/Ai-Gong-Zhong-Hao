import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  ExternalLink,
  RefreshCw,
  Search,
  Sparkles,
  Heart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAppStore } from '@/stores/useAppStore';
import { fetchAllHotTopics } from '@/services/api';
import type { HotTopic } from '@/types';

const sourceColors: Record<string, string> = {
  baidu: 'bg-blue-500',
  weibo: 'bg-red-500',
  douyin: 'bg-pink-500',
  zhihu: 'bg-blue-600',
  bilibili: 'bg-pink-400',
  toutiao: 'bg-red-600',
};

const sourceNames: Record<string, string> = {
  baidu: '百度',
  weibo: '微博',
  douyin: '抖音',
  zhihu: '知乎',
  bilibili: 'B站',
  toutiao: '头条',
};

export function HotTopicsPage() {
  const navigate = useNavigate();
  const { hotTopics, setHotTopics, settings, toggleFavoriteTopic } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [dataStatus, setDataStatus] = useState<{ stale?: boolean; mock?: boolean }>({});

  const [pendingTopic, setPendingTopic] = useState<HotTopic | null>(null);
  const favoriteTopics = settings.favoriteTopics || [];

  useEffect(() => {
    loadHotTopics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadHotTopics = async () => {
    setLoading(true);
    try {
      const result = await fetchAllHotTopics();
      setHotTopics(result.topics);
      setDataStatus({ stale: result.stale, mock: result.mock });
    } catch (error) {
      console.error('加载热点失败:', error);
      toast.error('加载热点失败', { description: '请检查网络连接后重试' });
    } finally {
      setLoading(false);
    }
  };

  const filteredTopics = hotTopics.filter((topic) => {
    const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'favorites') {
      return matchesSearch && favoriteTopics.includes(topic.id);
    }
    const matchesTab = activeTab === 'all' || topic.source === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleTopicClick = (topic: HotTopic) => {
    // 检查是否有未保存内容，弹确认框
    const { currentArticle } = useAppStore.getState();
    if (currentArticle?.content) {
      setPendingTopic(topic);
    } else {
      doNavigate(topic);
    }
  };

  const doNavigate = (topic: HotTopic) => {
    navigate('/editor', { state: { topic } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">热点趋势</h1>
          <p className="text-muted-foreground">
            实时追踪各平台热点，一键生成爆款文章
          </p>
        </div>
        <Button onClick={loadHotTopics} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新热点
        </Button>
      </div>

      {/* 数据来源提示 */}
      {dataStatus.mock && (
        <div className="flex items-center gap-2 rounded-lg border border-muted bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <Flame className="h-4 w-4" />
          未能获取实时热点，当前显示示例数据。请稍后刷新重试。
        </div>
      )}
      {dataStatus.stale && !dataStatus.mock && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
          <RefreshCw className="h-4 w-4" />
          当前显示缓存数据，可能不是最新热点。点击"刷新热点"获取最新数据。
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索热点..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="baidu">百度</TabsTrigger>
          <TabsTrigger value="weibo">微博</TabsTrigger>
          <TabsTrigger value="douyin">抖音</TabsTrigger>
          <TabsTrigger value="zhihu">知乎</TabsTrigger>
          <TabsTrigger value="toutiao">头条</TabsTrigger>
          <TabsTrigger value="bilibili">B站</TabsTrigger>
          <TabsTrigger value="favorites">
            收藏
            {favoriteTopics.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {favoriteTopics.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading && hotTopics.length === 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {loading && (
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  刷新中，当前列表会保留显示
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTopics.map((topic, index) => (
                  <Card
                  key={topic.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`用AI仿写热点：${topic.title}`}
                  className="group cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
                  onClick={() => handleTopicClick(topic)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleTopicClick(topic);
                    }
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          {index + 1}
                        </span>
                        <Badge className={`${sourceColors[topic.source]} text-white`}>
                          {sourceNames[topic.source]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label={favoriteTopics.includes(topic.id) ? '取消收藏热点' : '收藏热点'}
                          title={favoriteTopics.includes(topic.id) ? '取消收藏热点' : '收藏热点'}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteTopic(topic.id);
                          }}
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              favoriteTopics.includes(topic.id)
                                ? 'fill-red-500 text-red-500'
                                : 'text-muted-foreground'
                            }`}
                          />
                        </Button>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Flame className="h-4 w-4 text-orange-500" />
                          <span className="text-sm">{formatHot(topic.hot)}</span>
                        </div>
                      </div>
                    </div>
                    <CardTitle className="line-clamp-2 text-base mt-2 group-hover:text-primary transition-colors">
                      {topic.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTopicClick(topic);
                          }}
                        >
                          <Sparkles className="h-3 w-3" />
                          AI仿写
                        </Button>
                      </div>
                      <a
                        href={topic.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        查看原文
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {!loading && filteredTopics.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                {activeTab === 'favorites' ? '暂无收藏的热点' : '未找到相关热点'}
              </h3>
              <p className="text-muted-foreground">
                {activeTab === 'favorites'
                  ? '点击热点卡片上的心形图标收藏'
                  : '尝试更换搜索词或切换平台筛选'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 覆盖确认弹窗 */}
      <Dialog open={!!pendingTopic} onOpenChange={() => setPendingTopic(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>当前有未保存的内容</DialogTitle>
            <DialogDescription>
              进入热点写作会覆盖当前编辑器内容，继续前请确认是否保留现有草稿。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingTopic(null)}>取消</Button>
            <Button onClick={() => { if (pendingTopic) doNavigate(pendingTopic); setPendingTopic(null); }}>
              继续
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatHot(hot: number): string {
  if (hot >= 10000) {
    return `${(hot / 10000).toFixed(1)}万`;
  }
  return hot.toString();
}
