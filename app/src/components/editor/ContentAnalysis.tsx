import { useState } from 'react';
import {
  BarChart3,
  Search,
  CheckCircle,
  Download,
  Loader2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Lightbulb,
  Target,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  convertInchesToTwip,
} from 'docx';
import { saveAs } from 'file-saver';
import { analyzeContent, type AIAnalysisResult } from '@/services/api';
import { useAppStore } from '@/stores/useAppStore';

interface ContentAnalysisProps {
  title: string;
  content: string;
  onAnalysisComplete?: (result: AIAnalysisResult) => void;
}

// ── Helper: score color ──────────────────────────────────────────────
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
  if (score >= 60) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
  return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return '优秀';
  if (score >= 60) return '一般';
  return '需改进';
}

// ── Collapsible Section ──────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  score,
  scoreLabel,
  defaultOpen = true,
  children,
}: {
  icon: React.ElementType;
  title: string;
  score?: number;
  scoreLabel?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {score !== undefined && scoreLabel && (
            <Badge variant="secondary" className={`text-xs ${getScoreBg(score)}`}>
              {scoreLabel}
            </Badge>
          )}
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {open && <div className="px-3 pb-3 border-t">{children}</div>}
    </div>
  );
}

// ── Export analysis report as Word ───────────────────────────────────
async function exportAnalysisReport(title: string, result: AIAnalysisResult) {
  const { qualityScore, seo, readability, sentiment, improvements } = result;

  const makeText = (text: string, opts?: { bold?: boolean; size?: number; color?: string }) =>
    new TextRun({ text, size: opts?.size || 22, font: 'Microsoft YaHei', bold: opts?.bold, color: opts?.color });

  const makeParagraph = (text: string, opts?: { bold?: boolean; size?: number; color?: string; spacing?: object }) =>
    new Paragraph({
      children: [makeText(text, opts)],
      spacing: opts?.spacing || { after: convertInchesToTwip(0.1) },
    });

  const children: Paragraph[] = [];

  // Title
  children.push(new Paragraph({
    children: [makeText(`文章AI分析报告`, { bold: true, size: 36 })],
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: convertInchesToTwip(0.2) },
  }));
  children.push(makeParagraph(`文章标题：${title || '（无标题）'}`, { size: 24, bold: true }));
  children.push(makeParagraph(`生成时间：${new Date().toLocaleString('zh-CN')}`, { color: '666666' }));
  children.push(new Paragraph({ children: [], spacing: { after: convertInchesToTwip(0.15) } }));

  // ── Section 1: Content Quality Score ──
  children.push(makeParagraph('一、内容质量评分', { bold: true, size: 28 }));
  children.push(makeParagraph(`综合评分：${qualityScore} 分`, {
    bold: true,
    size: 24,
    color: qualityScore >= 80 ? '16A34A' : qualityScore >= 60 ? 'D97706' : 'DC2626',
  }));
  children.push(new Paragraph({ children: [], spacing: { after: convertInchesToTwip(0.1) } }));

  // ── Section 2: SEO Analysis ──
  children.push(makeParagraph('二、SEO优化建议', { bold: true, size: 28 }));
  children.push(makeParagraph(`SEO评分：${seo.score} 分`, {
    bold: true,
    color: seo.score >= 80 ? '16A34A' : seo.score >= 60 ? 'D97706' : 'DC2626',
  }));
  if (seo.suggestions.length > 0) {
    children.push(makeParagraph('优化建议：', { bold: true }));
    for (const suggestion of seo.suggestions) {
      children.push(makeParagraph(`  • ${suggestion}`));
    }
  }
  children.push(new Paragraph({ children: [], spacing: { after: convertInchesToTwip(0.1) } }));

  // ── Section 3: Readability Analysis ──
  children.push(makeParagraph('三、可读性分析', { bold: true, size: 28 }));
  children.push(makeParagraph(`可读性评分：${readability.score} 分（${readability.level}）`, {
    bold: true,
    color: readability.score >= 80 ? '16A34A' : readability.score >= 60 ? 'D97706' : 'DC2626',
  }));
  if (readability.details.length > 0) {
    children.push(makeParagraph('分析详情：', { bold: true }));
    for (const detail of readability.details) {
      children.push(makeParagraph(`  • ${detail}`));
    }
  }
  children.push(new Paragraph({ children: [], spacing: { after: convertInchesToTwip(0.1) } }));

  // ── Section 4: Sentiment Analysis ──
  children.push(makeParagraph('四、情感倾向分析', { bold: true, size: 28 }));
  const sentimentIcon = sentiment.type === 'positive' ? '👍' : sentiment.type === 'negative' ? '👎' : '😐';
  children.push(makeParagraph(`情感倾向：${sentimentIcon} ${sentiment.type === 'positive' ? '积极' : sentiment.type === 'negative' ? '消极' : '中性'}`, {
    bold: true,
    size: 24,
  }));
  children.push(makeParagraph(`情感强度：${sentiment.score} 分`));
  children.push(makeParagraph(sentiment.description));
  children.push(new Paragraph({ children: [], spacing: { after: convertInchesToTwip(0.1) } }));

  // ── Section 5: Improvements ──
  children.push(makeParagraph('五、改进建议', { bold: true, size: 28 }));
  if (improvements.length > 0) {
    for (let i = 0; i < improvements.length; i++) {
      children.push(makeParagraph(`${i + 1}. ${improvements[i]}`));
    }
  } else {
    children.push(makeParagraph('暂无改进建议'));
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.25),
            right: convertInchesToTwip(1.25),
          },
        },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title || '文章'}_AI分析报告.docx`);
}

// ── Main Component ───────────────────────────────────────────────────
export function ContentAnalysis({ title, content, onAnalysisComplete }: ContentAnalysisProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useAppStore();

  const handleAnalyze = async () => {
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    if (!plainText) {
      toast.error('请先写点内容再进行分析');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeContent(
        title,
        content,
        settings.ai.apiKey,
        settings.ai.model,
        settings.ai.baseUrl
      );
      setAiResult(result);
      onAnalysisComplete?.(result);
      toast.success('AI分析完成');
    } catch (e) {
      console.error('AI分析错误:', e);
      setError('AI分析失败，请检查网络连接或API配置后重试');
      toast.error('AI分析失败，请重试');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExport = async () => {
    if (!aiResult) return;
    try {
      await exportAnalysisReport(title, aiResult);
      toast.success('分析报告已下载');
    } catch (e) {
      console.error('Export error:', e);
      toast.error('导出失败，请重试');
    }
  };

  // No results yet — show start button
  if (!aiResult) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="p-3 rounded-full bg-muted">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">文章AI智能分析</p>
            <p className="text-xs text-muted-foreground">
              从内容质量、SEO、可读性、情感倾向等维度全面分析你的文章
            </p>
          </div>
          {error && (
            <div className="w-full p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          <Button onClick={handleAnalyze} disabled={analyzing} className="w-full">
            {analyzing ? (
              <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> AI分析中...</>
            ) : (
              <><Sparkles className="mr-1.5 h-4 w-4" /> 开始AI分析</>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { qualityScore, seo, readability, sentiment, improvements } = aiResult;

  return (
    <div className="space-y-3">
      {/* Header with re-analyze and export buttons */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? (
            <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> AI分析中...</>
          ) : (
            <><Sparkles className="mr-1.5 h-3.5 w-3.5" /> 重新分析</>
          )}
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={handleExport}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> 下载报告
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Section 1: Content Quality Score */}
      <Section
        icon={Target}
        title="内容质量评分"
        score={qualityScore}
        scoreLabel={`${qualityScore}分 · ${getScoreLabel(qualityScore)}`}
        defaultOpen={true}
      >
        <div className="pt-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>综合评分</span>
              <span className={`font-bold ${getScoreColor(qualityScore)}`}>{qualityScore}分</span>
            </div>
            <Progress value={qualityScore} className="h-2" />
          </div>
        </div>
      </Section>

      {/* Section 2: SEO */}
      <Section
        icon={Search}
        title="SEO优化建议"
        score={seo.score}
        scoreLabel={`${seo.score}分 · ${getScoreLabel(seo.score)}`}
        defaultOpen={true}
      >
        <div className="space-y-2 pt-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>SEO评分</span>
              <span className={`font-bold ${getScoreColor(seo.score)}`}>{seo.score}分</span>
            </div>
            <Progress value={seo.score} className="h-2" />
          </div>
          {seo.suggestions.length > 0 && (
            <>
              <Separator className="my-2" />
              <div className="text-xs font-medium text-muted-foreground mb-1.5">优化建议</div>
              {seo.suggestions.map((suggestion: string, index: number) => (
                <div key={index} className="flex items-start gap-2 text-xs">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <span>{suggestion}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </Section>

      {/* Section 3: Readability */}
      <Section
        icon={BookOpen}
        title="可读性分析"
        score={readability.score}
        scoreLabel={`${readability.score}分 · ${readability.level}`}
        defaultOpen={true}
      >
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>可读性评分</span>
              <span className={`font-bold ${getScoreColor(readability.score)}`}>{readability.score}分</span>
            </div>
            <Progress value={readability.score} className="h-2" />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">可读性等级</span>
            <Badge variant="secondary">{readability.level}</Badge>
          </div>
          {readability.details.length > 0 && (
            <>
              <Separator className="my-2" />
              <div className="text-xs font-medium text-muted-foreground mb-1.5">分析详情</div>
              {readability.details.map((detail: string, index: number) => (
                <div key={index} className="flex items-start gap-2 text-xs">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                  <span>{detail}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </Section>

      {/* Section 4: Sentiment Analysis */}
      <Section
        icon={sentiment.type === 'positive' ? ThumbsUp : sentiment.type === 'negative' ? ThumbsDown : Minus}
        title="情感倾向分析"
        score={sentiment.score}
        scoreLabel={sentiment.type === 'positive' ? '积极' : sentiment.type === 'negative' ? '消极' : '中性'}
        defaultOpen={true}
      >
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span>情感类型</span>
            <Badge variant="secondary" className={
              sentiment.type === 'positive' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              sentiment.type === 'negative' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
              'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
            }>
              {sentiment.type === 'positive' ? '积极' : sentiment.type === 'negative' ? '消极' : '中性'}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">情感强度</span>
            <span className={`font-bold ${getScoreColor(sentiment.score)}`}>{sentiment.score}分</span>
          </div>
          <Progress value={sentiment.score} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {sentiment.description}
          </div>
        </div>
      </Section>

      {/* Section 5: Improvements */}
      <Section
        icon={Lightbulb}
        title="改进建议"
        defaultOpen={true}
      >
        <div className="space-y-2 pt-2">
          {improvements.length > 0 ? (
            improvements.map((improvement: string, index: number) => (
              <div key={index} className="flex items-start gap-2 text-xs">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                  {index + 1}
                </span>
                <span>{improvement}</span>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>暂无改进建议，文章质量优秀</span>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
