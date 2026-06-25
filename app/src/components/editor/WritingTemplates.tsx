import { useState } from 'react';
import { BookOpen, ChevronRight, Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface WritingTemplate {
  id: string;
  name: string;
  content: string;
}

interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
  templates: WritingTemplate[];
}

const templateCategories: TemplateCategory[] = [
  {
    id: 'titles',
    name: '爆款标题',
    icon: '',
    templates: [
      { id: 't1', name: '数字型', content: 'X个方法让你的XXX提升XX%' },
      { id: 't2', name: '疑问型', content: '为什么XXX？看完这篇你就懂了' },
      { id: 't3', name: '对比型', content: 'XXX vs XXX，到底哪个更适合你？' },
      { id: 't4', name: '故事型', content: '从XXX到XXX，他只做对了这一件事' },
      { id: 't5', name: '干货型', content: 'XXX全攻略：从入门到精通（建议收藏）' },
      { id: 't6', name: '情绪型', content: '看完这篇XXX，我沉默了...' },
      { id: 't7', name: '悬念型', content: 'XXX背后的真相，99%的人都不知道' },
      { id: 't8', name: '热点型', content: 'XXX火了！普通人如何抓住这波机会？' },
    ],
  },
  {
    id: 'openings',
    name: '开头模板',
    icon: '',
    templates: [
      { id: 'o1', name: '提问式', content: '你有没有想过，为什么XXX？今天我们就来聊聊这个话题。' },
      { id: 'o2', name: '故事式', content: '前几天，我的朋友小X跟我吐槽了一件事...（故事引入正文）' },
      { id: 'o3', name: '数据式', content: '根据最新数据显示，XX%的人在XXX方面存在困惑。今天这篇文章，将为你解答。' },
      { id: 'o4', name: '痛点式', content: '你是不是也遇到过这样的情况：XXX？别担心，这篇文章就是为你准备的。' },
      { id: 'o5', name: '热点式', content: '最近XXX话题火了，很多人都在讨论。作为一个XXX，我想从XXX角度来谈谈我的看法。' },
      { id: 'o6', name: '金句式', content: '有人说："XXXXXX。"我深以为然。今天就来聊聊XXX。' },
      { id: 'o7', name: '反转式', content: '我曾经以为XXX，直到有一天XXX，才发现原来XXX。' },
      { id: 'o8', name: '场景式', content: '周末的午后，我坐在咖啡厅里，刷到一条关于XXX的新闻，让我陷入了沉思...' },
    ],
  },
  {
    id: 'endings',
    name: '结尾模板',
    icon: '',
    templates: [
      { id: 'e1', name: '总结式', content: '以上就是今天的全部内容，我们来简单回顾一下：\n1. XXX\n2. XXX\n3. XXX\n希望对你有所帮助！' },
      { id: 'e2', name: '号召式', content: '如果你觉得这篇文章有用，别忘了点赞+收藏+转发，让更多人看到！' },
      { id: 'e3', name: '互动式', content: '关于XXX，你有什么看法？欢迎在评论区留言，我们一起讨论！' },
      { id: 'e4', name: '升华式', content: 'XXX不仅仅是一种XXX，更是一种XXX态度。愿我们都能XXX。共勉。' },
      { id: 'e5', name: '预告式', content: '下期预告：我们将深入探讨XXX，敬请期待！关注我，不错过任何干货。' },
      { id: 'e6', name: '金句式', content: '最后送给大家一句话：\n"XXXXXX。"\n与诸位共勉。' },
      { id: 'e7', name: '反思式', content: '写到这里，我突然想到一个问题：我们真的理解XXX吗？也许，答案就在我们每天的XXX中。' },
      { id: 'e8', name: '温暖式', content: '愿你在XXX的路上，既有披荆斩棘的勇气，也有细嗅蔷薇的温柔。我们下期见' },
    ],
  },
  {
    id: 'quotes',
    name: '金句模板',
    icon: '',
    templates: [
      { id: 'q1', name: '励志型', content: '每一个优秀的人，都有一段沉默的时光。' },
      { id: 'q2', name: '思考型', content: '所谓成长，就是不断地与过去的自己告别。' },
      { id: 'q3', name: '生活型', content: '生活不是等待暴风雨过去，而是学会在雨中翩翩起舞。' },
      { id: 'q4', name: '职场型', content: '你的价值，不在于你做了多少事，而在于你做对了多少事。' },
      { id: 'q5', name: '情感型', content: '最好的关系，不是每天都联系，而是即使许久不见，依然如故。' },
      { id: 'q6', name: '哲理型', content: '人生没有白走的路，每一步都算数。' },
      { id: 'q7', name: '行动型', content: '想，都是问题；做，才有答案。' },
      { id: 'q8', name: '格局型', content: '你读过的书、走过的路、爱过的人，都会藏在你的气质里。' },
    ],
  },
];

interface WritingTemplatesProps {
  onInsert: (content: string) => void;
}

export function WritingTemplates({ onInsert }: WritingTemplatesProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('titles');

  const handleInsert = (template: WritingTemplate) => {
    onInsert(template.content);
    toast.success(`已插入模板: ${template.name}`);
    setOpen(false);
  };

  const handleCopy = (template: WritingTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(template.content);
    toast.success('已复制到剪贴板');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <BookOpen className="mr-1 h-4 w-4" />
          写作模板
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>写作模板库</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            {templateCategories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                {cat.icon} {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {templateCategories.map((cat) => (
            <TabsContent key={cat.id} value={cat.id}>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {cat.templates.map((template) => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleInsert(template)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs">
                                {template.name}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {template.content}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => handleCopy(template, e)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
