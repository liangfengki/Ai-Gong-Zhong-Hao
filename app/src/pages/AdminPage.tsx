import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Users,
  FileText,
  Sparkles,
  TrendingUp,
  Loader2,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

const ADMIN_TOKEN_KEY = 'admin-ki-token';

interface Stats {
  totalUsers: number;
  newUsers24h: number;
  totalDocuments: number;
  totalGenerations: number;
  generations7d: number;
  byAction: Array<{ action: string; count: number }>;
  dailyTrend: Array<{ date: string; count: number }>;
}

interface AdminUser {
  id: string;
  username?: string | null;
  email: string;
  createdAt: string;
  documentCount: number;
  generationCount: number;
}

const ACTION_LABELS: Record<string, string> = {
  generate_article: '文章生成',
  generate_image: '图片生成',
  generate_video: '视频生成',
  analyze_content: '内容分析',
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error || fallback;
  }
  return fallback;
}

export function AdminPage() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(ADMIN_TOKEN_KEY));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('请输入账号和密码');
      return;
    }
    setIsLoggingIn(true);
    try {
      const { data } = await axios.post('/api/admin/login', { username, password });
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      setToken(data.token);
      toast.success('登录成功');
    } catch (error) {
      toast.error('登录失败', { description: getErrorMessage(error, '账号或密码错误') });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
    setStats(null);
    setUsers([]);
  }, []);

  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, usersRes] = await Promise.all([
        axios.get<Stats>('/api/admin/stats', { headers }),
        axios.get<{ items: AdminUser[] }>('/api/admin/users', { headers, params: { page: 1, limit: 50 } }),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.items);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error('登录已过期，请重新登录');
        handleLogout();
      } else {
        toast.error('加载失败', { description: getErrorMessage(error, '无法获取数据') });
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, handleLogout]);

  useEffect(() => {
    if (token) loadData();
  }, [token, loadData]);

  // ============ 登录界面 ============
  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">后台管理</CardTitle>
            <CardDescription>管理员专用入口</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">账号</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="管理员账号"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="管理员密码"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                登录
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============ 仪表盘 ============
  const statCards = [
    { label: '注册用户', value: stats?.totalUsers ?? '-', icon: Users, hint: `24h 新增 ${stats?.newUsers24h ?? 0}` },
    { label: '生成总次数', value: stats?.totalGenerations ?? '-', icon: Sparkles, hint: `近 7 天 ${stats?.generations7d ?? 0}` },
    { label: '文章总数', value: stats?.totalDocuments ?? '-', icon: FileText, hint: '云端存储' },
    { label: '日均生成', value: stats?.dailyTrend?.length ? Math.round((stats.dailyTrend.reduce((s, d) => s + d.count, 0)) / stats.dailyTrend.length) : '-', icon: TrendingUp, hint: '近 14 天均值' },
  ];

  const maxTrend = Math.max(1, ...(stats?.dailyTrend?.map((d) => d.count) ?? [1]));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* 顶部 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">后台管理</h1>
            <p className="text-muted-foreground">用户与生成数据统计</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              刷新
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              退出
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{card.label}</p>
                      <p className="text-3xl font-bold">{card.value}</p>
                      <p className="text-xs text-muted-foreground">{card.hint}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 生成类型分布 + 趋势 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">按类型统计</CardTitle>
              <CardDescription>各功能使用次数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.byAction?.length ? (
                stats.byAction.map((item) => (
                  <div key={item.action} className="flex items-center justify-between text-sm">
                    <span>{ACTION_LABELS[item.action] || item.action}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">暂无数据</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">近 14 天生成趋势</CardTitle>
              <CardDescription>每日生成次数</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.dailyTrend?.length ? (
                <div className="flex h-40 items-end gap-1">
                  {stats.dailyTrend.map((d) => (
                    <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${d.date}: ${d.count}`}>
                      <div
                        className="w-full rounded-t bg-primary/70"
                        style={{ height: `${(d.count / maxTrend) * 100}%`, minHeight: d.count > 0 ? '4px' : '0' }}
                      />
                      <span className="text-[10px] text-muted-foreground">{d.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">暂无数据</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 用户注册记录 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">用户注册记录</CardTitle>
            <CardDescription>共 {stats?.totalUsers ?? 0} 位用户</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">用户名</th>
                    <th className="pb-2 font-medium">邮箱</th>
                    <th className="pb-2 font-medium">注册时间</th>
                    <th className="pb-2 font-medium text-right">文章数</th>
                    <th className="pb-2 font-medium text-right">生成次数</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length ? (
                    users.map((u) => (
                      <tr key={u.id} className="border-b last:border-0">
                        <td className="py-2">{u.username || '-'}</td>
                        <td className="py-2">{u.email}</td>
                        <td className="py-2 text-muted-foreground">{new Date(u.createdAt).toLocaleString('zh-CN')}</td>
                        <td className="py-2 text-right">{u.documentCount}</td>
                        <td className="py-2 text-right">{u.generationCount}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">暂无用户</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
