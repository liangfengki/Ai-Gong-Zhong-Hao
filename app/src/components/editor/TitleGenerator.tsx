import { useState } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Copy, 
  Check,
  Lightbulb,
  Eye,
  MessageSquare,
  Heart,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/useAppStore';

// 标题风格类型
type TitleStyle = 'opinion' | 'curiosity' | 'suspense' | 'emotion' | 'painpoint';

// 标题风格配置
const titleStyles = {
  opinion: {
    name: '观点鲜明',
    icon: Lightbulb,
    color: 'bg-yellow-500',
    description: '立场清晰，自带情绪和价值感',
    tips: [
      '直接表达核心态度',
      '使用肯定/否定词汇',
      '避免模糊表述',
      '适合成长、情感类内容'
    ]
  },
  curiosity: {
    name: '好奇心+反差',
    icon: Eye,
    color: 'bg-blue-500',
    description: '打破常识，制造认知反差',
    tips: [
      '用提问抛出疑惑',
      '反常识、相悖观点',
      '打破固有思维',
      '跳出内容同质化'
    ]
  },
  suspense: {
    name: '悬念留白',
    icon: MessageSquare,
    color: 'bg-purple-500',
    description: '隐藏关键信息，吊足胃口',
    tips: [
      '只透露部分信息',
      '隐藏核心内容',
      '制造探索欲望',
      '适合实用知识类'
    ]
  },
  emotion: {
    name: '情绪共鸣',
    icon: Heart,
    color: 'bg-red-500',
    description: '瞄准生活压力，引发共情',
    tips: [
      '戳中身份认同',
      '亲情感悟',
      '生活压力共鸣',
      '让读者觉得"说的就是自己"'
    ]
  },
  painpoint: {
    name: '痛点+价值',
    icon: Target,
    color: 'bg-green-500',
    description: '直击痛点，凸显实用价值',
    tips: [
      '精准戳中烦恼',
      '给出解决期待',
      '点明干货技巧',
      '让人知道能学到东西'
    ]
  }
};

// 标题模板库
const titleTemplates: Record<TitleStyle, string[]> = {
  opinion: [
    '{topic}，我认为这是最{adj}的选择',
    '别再{action}了，真正{adj}的人都这样做',
    '{topic}的本质，其实是{insight}',
    '我为什么坚持{topic}？因为{reason}',
    '{topic}这件事，{stance}才是对的'
  ],
  curiosity: [
    '为什么{phenomenon}？真相让人意外',
    '{topic}竟然{result}？99%的人都不知道',
    '当{condition}时，{unexpected_result}',
    '{common_belief}？其实恰恰相反',
    '你以为的{topic}，其实是{real_meaning}'
  ],
  suspense: [
    '{topic}的{number}个秘密，最后一个太{adj}',
    '当我{action}后，发现了{topic}的真相',
    '{topic}背后的故事，看完沉默了',
    '这个{topic}的方法，我犹豫了很久要不要分享',
    '{topic}的{number}个阶段，你在第几个？'
  ],
  emotion: [
    '致{audience}：{topic}，你并不孤单',
    '{time_period}的{audience}，都懂这种感受',
    '当{scene}时，我终于理解了{topic}',
    '{audience}的{topic}，看哭了多少人',
    '我们都曾{experience}，直到{revelation}'
  ],
  painpoint: [
    '{audience}必看：{topic}的{number}个实用技巧',
    '告别{pain}，{topic}让你{benefit}',
    '{topic}难题？这个方法一招解决',
    '学会{topic}，{benefit}不再是梦',
    '{audience}都在用的{topic}秘籍，建议收藏'
  ]
};

interface TitleGeneratorProps {
  onApplyTitle: (title: string) => void;
  initialKeyword?: string;
}

export function TitleGenerator({ onApplyTitle, initialKeyword = '' }: TitleGeneratorProps) {
  const { settings } = useAppStore();
  const [keyword, setKeyword] = useState(initialKeyword);
  const [generatedTitles, setGeneratedTitles] = useState<Record<TitleStyle, string[]>>({
    opinion: [],
    curiosity: [],
    suspense: [],
    emotion: [],
    painpoint: []
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TitleStyle>('opinion');

  // 生成标题
  const handleGenerate = async () => {
    if (!keyword.trim()) {
      toast.error('请输入关键词或主题');
      return;
    }

    setIsGenerating(true);

    try {
      // 如果有AI API，使用AI生成
      if (settings.ai.apiKey) {
        const titles = await generateWithAI(keyword);
        setGeneratedTitles(titles);
      } else {
        // 否则使用模板生成
        const titles = generateWithTemplates(keyword);
        setGeneratedTitles(titles);
      }
      
      toast.success('标题生成完成');
    } catch (error) {
      toast.error('生成失败，请重试');
      // 使用模板作为备用
      const titles = generateWithTemplates(keyword);
      setGeneratedTitles(titles);
    } finally {
      setIsGenerating(false);
    }
  };

  // 使用AI生成标题
  const generateWithAI = async (topic: string): Promise<Record<TitleStyle, string[]>> => {
    const prompts: Record<TitleStyle, string> = {
      opinion: `请围绕"${topic}"生成5个观点鲜明的公众号标题。要求：立场清晰，自带情绪和价值感，适合成长、情感类内容。直接输出标题，每行一个。`,
      curiosity: `请围绕"${topic}"生成5个勾起好奇心+制造认知反差的公众号标题。要求：用提问抛出疑惑，打破常识，反常识观点。直接输出标题，每行一个。`,
      suspense: `请围绕"${topic}"生成5个刻意留悬念卖关子的公众号标题。要求：只透露部分信息，隐藏关键内容，吊足读者胃口。直接输出标题，每行一个。`,
      emotion: `请围绕"${topic}"生成5个情绪深度共鸣的公众号标题。要求：瞄准生活压力、身份共情，让读者觉得"说的就是自己"。直接输出标题，每行一个。`,
      painpoint: `请围绕"${topic}"生成5个直击痛点+凸显利益价值的公众号标题。要求：精准戳中烦恼，给出解决期待，点明干货技巧。直接输出标题，每行一个。`
    };

    const results: Record<TitleStyle, string[]> = {
      opinion: [],
      curiosity: [],
      suspense: [],
      emotion: [],
      painpoint: []
    };

    // 通过后端 API 生成标题
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (settings.ai.apiKey) headers['x-api-key'] = settings.ai.apiKey;

    for (const [style, prompt] of Object.entries(prompts)) {
      try {
        const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            prompt: `你是一个专业的公众号标题创作专家，擅长创作高点击率的爆款标题。${prompt}`,
            wordCount: 200,
            model: settings.ai.model || 'gpt-3.5-turbo'
          })
        });

        const data = await response.json();
        if (data.content) {
          const titles = data.content
            .split('\n')
            .filter((t: string) => t.trim())
            .map((t: string) => t.replace(/^\d+[\.\)、]\s*/, '').trim());
          results[style as TitleStyle] = titles.slice(0, 5);
        }
      } catch (error) {
        console.error(`生成${style}风格标题失败:`, error);
      }
    }

    return results;
  };

  // 使用模板生成标题
  const generateWithTemplates = (topic: string): Record<TitleStyle, string[]> => {
    const results: Record<TitleStyle, string[]> = {
      opinion: [],
      curiosity: [],
      suspense: [],
      emotion: [],
      painpoint: []
    };

    const fillTemplate = (template: string) => {
      return template
        .replace(/\{topic\}/g, topic)
        .replace(/\{adj\}/g, '有效')
        .replace(/\{action\}/g, '这样做')
        .replace(/\{insight\}/g, '成长')
        .replace(/\{reason\}/g, '它能改变人生')
        .replace(/\{stance\}/g, '坚持')
        .replace(/\{phenomenon\}/g, `${topic}这么火`)
        .replace(/\{result\}/g, '这么有效')
        .replace(/\{condition\}/g, `深入了解${topic}`)
        .replace(/\{unexpected_result\}/g, '效果惊人')
        .replace(/\{common_belief\}/g, `${topic}很难`)
        .replace(/\{real_meaning\}/g, '成功的捷径')
        .replace(/\{number\}/g, '5')
        .replace(/\{audience\}/g, '普通人')
        .replace(/\{time_period\}/g, '30岁以后')
        .replace(/\{scene\}/g, '面对困境')
        .replace(/\{experience\}/g, '迷茫过')
        .replace(/\{revelation\}/g, '找到了方向')
        .replace(/\{pain\}/g, '低效')
        .replace(/\{benefit\}/g, '高效成长');
    };

    for (const [style, templates] of Object.entries(titleTemplates)) {
      results[style as TitleStyle] = templates.map(fillTemplate);
    }

    return results;
  };

  // 复制标题
  const handleCopy = (title: string, index: string) => {
    navigator.clipboard.writeText(title);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('标题已复制');
  };

  // 应用标题
  const handleApply = (title: string) => {
    onApplyTitle(title);
    toast.success('标题已应用');
  };

  const currentStyle = titleStyles[activeTab];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          爆款标题生成器
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 输入区域 */}
        <div className="space-y-2">
          <Input
            placeholder="输入文章主题或关键词..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <Button 
            className="w-full" 
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                生成爆款标题
              </>
            )}
          </Button>
        </div>

        {/* 标题风格选择 */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TitleStyle)}>
          <TabsList className="grid w-full grid-cols-5">
            {Object.entries(titleStyles).map(([key, style]) => {
              const Icon = style.icon;
              return (
                <TabsTrigger 
                  key={key} 
                  value={key}
                  className="flex flex-col items-center gap-1 py-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{style.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* 风格说明 */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Badge className={currentStyle.color}>
              <currentStyle.icon className="h-3 w-3 mr-1" />
              {currentStyle.name}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {currentStyle.description}
            </span>
          </div>

          {/* 创作技巧 */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">创作技巧：</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {currentStyle.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* 生成的标题列表 */}
          <TabsContent value={activeTab} className="space-y-2">
            {generatedTitles[activeTab].length > 0 ? (
              generatedTitles[activeTab].map((title, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="flex-1 text-sm">{title}</span>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(title, `${activeTab}-${index}`)}
                    >
                      {copiedIndex === `${activeTab}-${index}` ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleApply(title)}
                    >
                      使用
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>输入关键词后点击生成</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
