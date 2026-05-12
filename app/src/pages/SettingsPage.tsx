import { useState, useCallback, useMemo, useRef } from 'react';
import {
  Key,
  Sparkles,
  Newspaper,
  Rss,
  Github,
  Palette,
  Globe,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Upload,
  Database,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/useAppStore';
import type { WechatTemplate, AIProviderPreset } from '@/types';

// ============ 内置中转站预设 ============
const PROVIDER_PRESETS: AIProviderPreset[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
    icon: '🔮',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'o1', 'o1-mini', 'o1-pro'],
    icon: '🤖',
  },
  {
    id: 'claude',
    name: 'Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    icon: '🧠',
  },
  {
    id: 'moonshot',
    name: 'Kimi (月之暗面)',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    icon: '🌙',
  },
  {
    id: 'qwen',
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-long', 'qwen-vl-plus'],
    icon: '☁️',
  },
  {
    id: 'zhipu',
    name: '智谱 (GLM)',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4-flash', 'glm-4', 'glm-4-plus', 'glm-4v'],
    icon: '💎',
  },
  {
    id: 'baichuan',
    name: '百川智能',
    baseUrl: 'https://api.baichuan-ai.com/v1',
    models: ['Baichuan4', 'Baichuan3-Turbo', 'Baichuan2-Turbo'],
    icon: '🏔️',
  },
  {
    id: 'yi',
    name: '零一万物 (Yi)',
    baseUrl: 'https://api.lingyiwanwu.com/v1',
    models: ['yi-lightning', 'yi-large', 'yi-medium', 'yi-spark'],
    icon: '⚡',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: ['anthropic/claude-3.5-sonnet', 'google/gemini-pro-1.5', 'meta-llama/llama-3.1-405b-instruct', 'mistralai/mixtral-8x22b-instruct'],
    icon: '🔀',
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    baseUrl: 'https://api.siliconflow.cn/v1',
    models: ['deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1', 'Qwen/Qwen2.5-72B-Instruct', 'meta-llama/Meta-Llama-3.1-405B-Instruct'],
    icon: '🌊',
  },
  {
    id: 'custom',
    name: '自定义',
    baseUrl: '',
    models: [],
    icon: '⚙️',
  },
];

const skillIcons: Record<string, any> = {
  'remove-ai-style': Sparkles,
  'news-summary': Newspaper,
  'blog-monitor': Rss,
  'github-trending': Github,
};

export function SettingsPage() {
  const { settings, updateSettings, articles, exportData, importData } = useAppStore();

  // 测试连接状态（纯 UI 状态，不需要持久化）
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // 新模板表单（纯临时状态）
  const [newTemplate, setNewTemplate] = useState({ name: '', css: '' });

  // 数据导入状态
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  // 根据 store 中的 baseUrl 自动匹配当前提供商
  const selectedProvider = useMemo(() => {
    const matched = PROVIDER_PRESETS.find(p => p.baseUrl === settings.ai.baseUrl);
    return matched?.id || 'custom';
  }, [settings.ai.baseUrl]);

  const currentProvider = PROVIDER_PRESETS.find(p => p.id === selectedProvider);
  const availableModels = currentProvider?.models || [];

  // 当前模型是否在预设列表中
  const isPresetModel = availableModels.includes(settings.ai.model);
  const selectValue = isPresetModel ? settings.ai.model : '__custom__';

  // 更新 store 中某个设置字段的 helper
  const updateAI = useCallback((updates: Partial<typeof settings.ai>) => {
    updateSettings({ ai: { ...settings.ai, ...updates } });
  }, [settings.ai, updateSettings]);

  // 切换提供商预设
  const handleProviderChange = (providerId: string) => {
    const provider = PROVIDER_PRESETS.find(p => p.id === providerId);
    if (provider) {
      updateAI({
        baseUrl: provider.baseUrl,
        model: provider.models.length > 0 ? provider.models[0] : '',
      });
    }
  };

  // 测试连接
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.ai.apiKey && { 'x-api-key': settings.ai.apiKey }),
          'x-base-url': settings.ai.baseUrl,
          'x-model': settings.ai.model,
        },
        body: JSON.stringify({
          prompt: '你好，请回复"连接成功"',
          wordCount: 50,
          model: settings.ai.model,
        }),
      });
      if (res.ok) {
        setTestResult('success');
        toast.success('连接成功', { description: 'API 可正常调用' });
      } else {
        const err = await res.json().catch(() => ({}));
        setTestResult('error');
        toast.error('连接失败', { description: err.error || '请检查配置' });
      }
    } catch (e) {
      setTestResult('error');
      toast.error('连接失败', { description: '网络错误或服务未启动' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggleSkill = (skillId: string) => {
    const updated = settings.skills.map((s) =>
      s.id === skillId ? { ...s, enabled: !s.enabled } : s
    );
    updateSettings({ skills: updated });
  };

  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.css) {
      toast.error('请填写完整', { description: '模板名称和CSS样式不能为空' });
      return;
    }
    const template: WechatTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      css: newTemplate.css,
      preview: '',
    };
    updateSettings({ templates: [...settings.templates, template] });
    setNewTemplate({ name: '', css: '' });
    toast.success('添加成功', { description: '排版模板已添加' });
  };

  const handleDeleteTemplate = (id: string) => {
    updateSettings({ templates: settings.templates.filter((t) => t.id !== id) });
  };

  // 导出数据
  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai公众号备份_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('导出成功', { description: `已导出 ${articles.length} 篇文章` });
  };

  // 导入数据
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      const result = importData(json);
      if (result.success) {
        toast.success('导入成功', { description: result.message });
      } else {
        toast.error('导入失败', { description: result.message });
      }
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      toast.error('导入失败', { description: '文件读取错误' });
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">设置</h1>
        <p className="text-muted-foreground">配置AI模型、排版模板和内置技能</p>
      </div>

      <Tabs defaultValue="ai" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ai" className="gap-2"><Key className="h-4 w-4" />AI配置</TabsTrigger>
          <TabsTrigger value="templates" className="gap-2"><Palette className="h-4 w-4" />排版模板</TabsTrigger>
          <TabsTrigger value="skills" className="gap-2"><Sparkles className="h-4 w-4" />内置技能</TabsTrigger>
          <TabsTrigger value="data" className="gap-2"><Database className="h-4 w-4" />数据管理</TabsTrigger>
        </TabsList>

        {/* ============ AI 配置 ============ */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>语言模型 (LLM)</CardTitle>
              <CardDescription>配置聊天、写作等语言模型的 API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Setup - 提供商选择 */}
              <div className="space-y-3">
                <Label>Quick Setup · 选择服务商</Label>
                <div className="flex flex-wrap gap-2">
                  {PROVIDER_PRESETS.map((provider) => (
                    <Button
                      key={provider.id}
                      variant={selectedProvider === provider.id ? 'default' : 'outline'}
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleProviderChange(provider.id)}
                    >
                      <span>{provider.icon}</span>
                      <span>{provider.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* API Base URL */}
              <div className="space-y-2">
                <Label htmlFor="baseUrl" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  API Base URL
                </Label>
                <Input
                  id="baseUrl"
                  placeholder="https://api.example.com/v1"
                  value={settings.ai.baseUrl}
                  onChange={(e) => updateAI({ baseUrl: e.target.value })}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  API 请求地址，不需要加 /chat/completions 等后缀
                </p>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  API Key
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-xxxxxxx"
                  value={settings.ai.apiKey}
                  onChange={(e) => updateAI({ apiKey: e.target.value })}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  留空则使用后端默认密钥（server/.env 中配置）
                </p>
              </div>

              {/* Chat Model ID */}
              <div className="space-y-2">
                <Label htmlFor="model" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Chat Model ID
                </Label>
                {availableModels.length > 0 ? (
                  <Select
                    value={selectValue}
                    onValueChange={(val) => {
                      if (val !== '__custom__') {
                        updateAI({ model: val });
                      } else {
                        updateAI({ model: '' });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择模型" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                      <SelectItem value="__custom__">自定义模型ID...</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="输入模型ID，例如 deepseek-chat"
                    value={settings.ai.model}
                    onChange={(e) => updateAI({ model: e.target.value })}
                    className="font-mono"
                  />
                )}
                {selectValue === '__custom__' && (
                  <Input
                    placeholder="输入自定义模型ID"
                    value={settings.ai.model}
                    onChange={(e) => updateAI({ model: e.target.value })}
                    className="font-mono mt-2"
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  选择或输入模型的ID名称
                </p>
              </div>

              <Separator />

              {/* 高级参数 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">温度 (Temperature)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={settings.ai.temperature}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateAI({ temperature: isNaN(val) ? 0.7 : val });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTokens">最大Token数</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="100"
                    max="32000"
                    value={settings.ai.maxTokens}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      updateAI({ maxTokens: isNaN(val) ? 2000 : val });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultWordCount">默认字数</Label>
                  <Input
                    id="defaultWordCount"
                    type="number"
                    min="500"
                    max="10000"
                    value={settings.defaultWordCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      updateSettings({ defaultWordCount: isNaN(val) ? 1500 : val });
                    }}
                  />
                </div>
              </div>

              <Separator />

              {/* 操作按钮 */}
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleTestConnection} disabled={isTesting}>
                  {isTesting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : testResult === 'success' ? (
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  ) : testResult === 'error' ? (
                    <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  测试连接
                </Button>
                {testResult === 'success' && <Badge variant="default" className="bg-green-500">连接正常</Badge>}
                {testResult === 'error' && <Badge variant="destructive">连接失败</Badge>}
                <span className="text-xs text-muted-foreground ml-auto">配置自动保存</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ 排版模板 ============ */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>排版模板</CardTitle>
              <CardDescription>管理公众号排版样式模板</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">添加新模板</h4>
                <div className="space-y-2">
                  <Label>模板名称</Label>
                  <Input
                    placeholder="输入模板名称..."
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CSS样式</Label>
                  <Textarea
                    placeholder="输入CSS样式代码..."
                    value={newTemplate.css}
                    onChange={(e) => setNewTemplate({ ...newTemplate, css: e.target.value })}
                    className="font-mono text-sm min-h-[150px]"
                  />
                </div>
                <Button onClick={handleAddTemplate}>添加模板</Button>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">已有模板</h4>
                {settings.templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无自定义模板，将使用默认排版样式</p>
                ) : (
                  <div className="space-y-2">
                    {settings.templates.map((template) => (
                      <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{template.css.substring(0, 50)}...</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id)}>删除</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ 内置技能 ============ */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>内置技能</CardTitle>
              <CardDescription>管理平台内置的AI技能</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.skills.map((skill) => {
                  const Icon = skillIcons[skill.id] || Sparkles;
                  return (
                    <div key={skill.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{skill.name}</p>
                          <p className="text-sm text-muted-foreground">{skill.description}</p>
                        </div>
                      </div>
                      <Switch checked={skill.enabled} onCheckedChange={() => handleToggleSkill(skill.id)} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ 数据管理 ============ */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>数据管理</CardTitle>
              <CardDescription>导出备份或导入文章数据</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 导出 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Download className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">导出备份</p>
                    <p className="text-sm text-muted-foreground">
                      将所有文章导出为 JSON 文件，可用于备份或迁移
                    </p>
                  </div>
                </div>
                <Button onClick={handleExport} disabled={articles.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  导出 ({articles.length} 篇)
                </Button>
              </div>

              {/* 导入 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">导入数据</p>
                    <p className="text-sm text-muted-foreground">
                      从 JSON 备份文件导入文章，相同文章会按更新时间合并
                    </p>
                  </div>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                    id="import-file"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    选择文件
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
