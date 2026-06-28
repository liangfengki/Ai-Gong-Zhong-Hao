import { useMemo, useState } from 'react';
import { FileText, LayoutList, PenLine, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  buildDomainTemplatePrompt,
  domainTemplates,
  type DomainGenerationMode,
  type DomainTemplate,
} from '@/lib/domainTemplates';

interface DomainTemplateSelectorProps {
  onApply: (payload: {
    template: DomainTemplate;
    mode: DomainGenerationMode;
    topic: string;
    prompt: string;
  }) => void;
}

const modeLabels: Record<DomainGenerationMode, string> = {
  title: '只生成标题',
  outline: '生成大纲',
  article: '完整文章',
};

export function DomainTemplateSelector({ onApply }: DomainTemplateSelectorProps) {
  const [selectedId, setSelectedId] = useState(domainTemplates[0].id);
  const [mode, setMode] = useState<DomainGenerationMode>('article');
  const [topic, setTopic] = useState('');
  const [extraRequirement, setExtraRequirement] = useState('');

  const selectedTemplate = useMemo(
    () => domainTemplates.find((template) => template.id === selectedId) ?? domainTemplates[0],
    [selectedId]
  );

  const prompt = useMemo(
    () =>
      buildDomainTemplatePrompt({
        template: selectedTemplate,
        topic,
        mode,
        extraRequirement,
      }),
    [extraRequirement, mode, selectedTemplate, topic]
  );

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            领域模板
          </Label>
          <Badge variant="secondary" className="text-[10px]">
            8大领域
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {domainTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => setSelectedId(template.id)}
              className={`rounded-lg border px-2 py-2 text-left transition-colors ${
                selectedId === template.id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <div className="truncate text-xs font-medium">{template.name}</div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {template.wordCount.min}-{template.wordCount.max}字
              </div>
            </button>
          ))}
        </div>
      </div>

      <Card className="rounded-lg">
        <CardContent className="space-y-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold">{selectedTemplate.name}</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {selectedTemplate.positioning}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 text-[10px]">
              {selectedTemplate.wordCount.recommended}字
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedTemplate.keywords.slice(0, 5).map((keyword) => (
              <Badge key={keyword} variant="secondary" className="text-[10px]">
                {keyword}
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <FileText className="mt-0.5 h-3.5 w-3.5" />
            <span>{selectedTemplate.imageAdvice}</span>
            <LayoutList className="mt-0.5 h-3.5 w-3.5" />
            <span>{selectedTemplate.contentStructure[0]}</span>
            <PenLine className="mt-0.5 h-3.5 w-3.5" />
            <span>{selectedTemplate.cta}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label className="text-xs font-medium">生成模式</Label>
        <Tabs value={mode} onValueChange={(value) => setMode(value as DomainGenerationMode)}>
          <TabsList className="grid w-full grid-cols-3">
            {Object.entries(modeLabels).map(([key, label]) => (
              <TabsTrigger key={key} value={key} className="text-[11px]">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">主题</Label>
        <Input
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder={`例如：${selectedTemplate.exampleTitles[0]}`}
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">补充要求</Label>
        <Textarea
          value={extraRequirement}
          onChange={(event) => setExtraRequirement(event.target.value)}
          placeholder="语气、受众、产品、禁忌等..."
          className="min-h-[54px] resize-none text-xs"
        />
      </div>

      <div className="rounded-lg bg-muted/50 p-2 text-[11px] leading-relaxed text-muted-foreground">
        标题公式：{selectedTemplate.titleFormulas.slice(0, 2).join(' / ')}
      </div>

      <Button
        type="button"
        className="w-full"
        size="sm"
        onClick={() => onApply({ template: selectedTemplate, mode, topic, prompt })}
      >
        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
        应用到 AI 写作
      </Button>
    </div>
  );
}
