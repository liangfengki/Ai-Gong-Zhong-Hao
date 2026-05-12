import { useState } from 'react';
import {
  BarChart3,
  AlertTriangle,
  Search,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  Loader2,
  ChevronDown,
  ChevronRight,
  Type,
  Clock,
  BookOpen,
  Sparkles,
  TrendingUp,
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

interface ContentAnalysisProps {
  title: string;
  content: string;
}

// ── AI Phrase Detection ──────────────────────────────────────────────
const AI_PHRASES = [
  '值得注意的是', '总而言之', '综上所述', '不言而喻', '毋庸置疑',
  '毫无疑问', '显而易见', '众所周知', '不可否认', '需要指出的是',
  '具体而言', '简而言之', '归根结底', '在当今社会', '随着…的发展',
  '首先', '其次', '最后', '一方面', '另一方面', '事实上',
  '可以说', '在这个背景下', '从某种意义上说', '与此同时',
  '不仅如此', '更重要的是', '由此可见', '因此', '总的来说',
  '换言之', '换句话说', '正如所述', '众所周知',
];

// ── Stop Words for keyword extraction ────────────────────────────────
const STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '他', '她', '它', '们', '那', '里', '为', '什么', '被', '把', '让',
  '用', '对', '从', '以', '但', '而', '与', '或', '如果', '虽然', '因为', '所以',
  '可以', '这个', '那个', '一些', '已经', '还', '又', '再', '才', '只',
  '等', '之', '其', '中', '来', '个', '大', '多', '能', '做', '过', '下',
  '后', '前', '时', '地', '可', '出', '种', '长', '如', '样', '想', '看',
  '更', '最', '所', '新', '每', '些', '比', '将', '并', '及', '向',
  '着', '过', '去', '起来', '下去', '上来', '那么', '这样', '怎样',
]);

// ── Helper: extract keywords ─────────────────────────────────────────
function extractKeywords(text: string, topN = 5): { word: string; count: number; density: string }[] {
  const tokens = text.match(/[\u4e00-\u9fff]{2,}/g) || [];
  const freq = new Map<string, number>();
  for (const token of tokens) {
    if (STOP_WORDS.has(token)) continue;
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  const totalWords = tokens.length || 1;
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({
      word,
      count,
      density: ((count / totalWords) * 100).toFixed(1),
    }));
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

// ── Analysis types ───────────────────────────────────────────────────
interface SEOAnalysis {
  title: { value: number; status: 'good' | 'warning'; message: string };
  contentLength: { value: number; status: 'good' | 'warning'; message: string };
  paragraphs: { value: number; status: 'good' | 'warning'; message: string };
  hasImages: { value: boolean; status: 'good' | 'warning'; message: string };
  firstParagraph: { value: number; status: 'good' | 'warning'; message: string };
  keywords: { word: string; count: number; density: string }[];
  keywordStatus: { status: 'good' | 'warning'; message: string };
}

interface ReadabilityAnalysis {
  score: number;
  avgSentenceLength: number;
  avgParagraphLength: number;
  sentenceCount: number;
  paragraphCount: number;
  sentenceLengthScore: number;
  paragraphLengthScore: number;
  sentenceCountScore: number;
  vocabDiversityScore: number;
}

interface AIDetectionAnalysis {
  score: number;
  detectedPhrases: { phrase: string; count: number }[];
}

interface AnalysisResult {
  charCount: number;
  readingTime: number;
  seo: SEOAnalysis;
  readability: ReadabilityAnalysis;
  aiDetection: AIDetectionAnalysis;
}

// ── Run analysis ─────────────────────────────────────────────────────
function runAnalysis(title: string, content: string): AnalysisResult {
  const plainText = content.replace(/<[^>]*>/g, '');
  const charCount = plainText.length;
  const readingTime = Math.max(1, Math.ceil(charCount / 500));

  // ── SEO Analysis ──
  const titleLength = title.length;
  let titleStatus: 'good' | 'warning' = 'good';
  let titleMsg = `标题长度合适（${titleLength}字）`;
  if (titleLength === 0) { titleStatus = 'warning'; titleMsg = '标题不能为空'; }
  else if (titleLength < 15) { titleStatus = 'warning'; titleMsg = `标题过短（${titleLength}字），建议15-30字`; }
  else if (titleLength > 30) { titleStatus = 'warning'; titleMsg = `标题过长（${titleLength}字），建议15-30字`; }

  let contentLengthStatus: 'good' | 'warning' = 'good';
  let contentLengthMsg = `正文字数充足（${charCount}字）`;
  if (charCount < 300) { contentLengthStatus = 'warning'; contentLengthMsg = '正文内容偏少，建议至少300字'; }

  const paragraphs = content.split(/<\/p>|<br\s*\/?>/gi).filter(p => p.replace(/<[^>]*>/g, '').trim().length > 0);
  let paraStatus: 'good' | 'warning' = 'good';
  let paraMsg = `段落结构良好（${paragraphs.length}段）`;
  if (paragraphs.length < 3) { paraStatus = 'warning'; paraMsg = '段落数较少，建议分3段以上'; }

  const hasImages = /<img\s/i.test(content);
  const imgStatus: 'good' | 'warning' = hasImages ? 'good' : 'warning';
  const imgMsg = hasImages ? '已包含配图' : '建议添加配图提升阅读体验';

  const firstParagraph = paragraphs[0]?.replace(/<[^>]*>/g, '').trim() || '';
  let fpStatus: 'good' | 'warning' = 'good';
  let fpMsg = '开头段落长度合适';
  if (firstParagraph.length > 0 && firstParagraph.length < 50) { fpStatus = 'warning'; fpMsg = '开头段落较短，建议在50-120字'; }
  else if (firstParagraph.length > 120) { fpStatus = 'warning'; fpMsg = '开头段落过长，建议精简到120字以内'; }

  const keywords = extractKeywords(plainText);
  let kwStatus: 'good' | 'warning' = 'good';
  let kwMsg = '关键词分布合理';
  if (keywords.length > 0) {
    const topDensity = parseFloat(keywords[0].density);
    if (topDensity > 5) { kwStatus = 'warning'; kwMsg = `关键词"${keywords[0].word}"密度过高（${keywords[0].density}%），建议控制在2-4%`; }
    else if (topDensity >= 1.5) { kwMsg = `核心词"${keywords[0].word}"密度${keywords[0].density}%`; }
    else { kwStatus = 'warning'; kwMsg = '关键词密度偏低，建议围绕核心主题增加关键词出现频次'; }
  }

  const seo: SEOAnalysis = {
    title: { value: titleLength, status: titleStatus, message: titleMsg },
    contentLength: { value: charCount, status: contentLengthStatus, message: contentLengthMsg },
    paragraphs: { value: paragraphs.length, status: paraStatus, message: paraMsg },
    hasImages: { value: hasImages, status: imgStatus, message: imgMsg },
    firstParagraph: { value: firstParagraph.length, status: fpStatus, message: fpMsg },
    keywords,
    keywordStatus: { status: kwStatus, message: kwMsg },
  };

  // ── Readability Analysis ──
  const sentences = plainText.split(/[。！？.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? charCount / sentences.length : 0;
  const avgParagraphLength = paragraphs.length > 0 ? charCount / paragraphs.length : 0;

  // Sentence length score (penalize if too long)
  let sentenceLengthScore = 100;
  if (avgSentenceLength > 50) sentenceLengthScore -= 15;
  if (avgSentenceLength > 80) sentenceLengthScore -= 20;
  if (avgSentenceLength > 120) sentenceLengthScore -= 15;

  // Paragraph length score
  let paragraphLengthScore = 100;
  if (avgParagraphLength > 300) paragraphLengthScore -= 15;
  if (avgParagraphLength > 500) paragraphLengthScore -= 15;
  if (avgParagraphLength > 800) paragraphLengthScore -= 10;

  // Sentence count score
  let sentenceCountScore = 100;
  if (sentences.length < 3) sentenceCountScore -= 30;
  else if (sentences.length < 5) sentenceCountScore -= 10;

  // Vocabulary diversity (unique chars / total chars)
  const uniqueChars = new Set(plainText).size;
  const vocabDiversity = charCount > 0 ? uniqueChars / Math.min(charCount, 500) : 0;
  const vocabDiversityScore = Math.min(100, Math.round(vocabDiversity * 200));

  const readabilityScore = Math.max(0, Math.min(100, Math.round(
    sentenceLengthScore * 0.3 + paragraphLengthScore * 0.25 + sentenceCountScore * 0.2 + vocabDiversityScore * 0.25
  )));

  const readability: ReadabilityAnalysis = {
    score: readabilityScore,
    avgSentenceLength: Math.round(avgSentenceLength),
    avgParagraphLength: Math.round(avgParagraphLength),
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    sentenceLengthScore: Math.max(0, sentenceLengthScore),
    paragraphLengthScore: Math.max(0, paragraphLengthScore),
    sentenceCountScore: Math.max(0, sentenceCountScore),
    vocabDiversityScore: Math.max(0, vocabDiversityScore),
  };

  // ── AI Detection ──
  const phraseCounts = new Map<string, number>();
  for (const phrase of AI_PHRASES) {
    const regex = new RegExp(phrase, 'g');
    const matches = plainText.match(regex);
    if (matches && matches.length > 0) {
      phraseCounts.set(phrase, matches.length);
    }
  }
  const detectedPhrases = Array.from(phraseCounts.entries())
    .map(([phrase, count]) => ({ phrase, count }))
    .sort((a, b) => b.count - a.count);

  const aiScore = Math.min(100, detectedPhrases.reduce((sum, p) => sum + p.count * 10, 0));

  const aiDetection: AIDetectionAnalysis = {
    score: aiScore,
    detectedPhrases,
  };

  return { charCount, readingTime, seo, readability, aiDetection };
}

// ── Export analysis report as Word ───────────────────────────────────
async function exportAnalysisReport(title: string, result: AnalysisResult) {
  const { charCount, readingTime, seo, readability, aiDetection } = result;

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
    children: [makeText(`文章分析报告`, { bold: true, size: 36 })],
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: convertInchesToTwip(0.2) },
  }));
  children.push(makeParagraph(`文章标题：${title || '（无标题）'}`, { size: 24, bold: true }));
  children.push(makeParagraph(`生成时间：${new Date().toLocaleString('zh-CN')}`, { color: '666666' }));
  children.push(new Paragraph({ children: [], spacing: { after: convertInchesToTwip(0.15) } }));

  // ── Section 1: Overview ──
  children.push(makeParagraph('一、基本概况', { bold: true, size: 28 }));
  children.push(makeParagraph(`总字数：${charCount} 字`));
  children.push(makeParagraph(`预估阅读时间：${readingTime} 分钟`));
  children.push(new Paragraph({ children: [], spacing: { after: convertInchesToTwip(0.1) } }));

  // ── Section 2: SEO ──
  children.push(makeParagraph('二、SEO 分析', { bold: true, size: 28 }));
  const seoItems = [seo.title, seo.contentLength, seo.paragraphs, seo.hasImages, seo.firstParagraph, seo.keywordStatus];
  for (const item of seoItems) {
    const prefix = item.status === 'good' ? '✓' : '⚠';
    children.push(makeParagraph(`${prefix} ${item.message}`, { color: item.status === 'good' ? '16A34A' : 'D97706' }));
  }
  if (seo.keywords.length > 0) {
    children.push(makeParagraph('关键词密度：', { bold: true }));
    for (const kw of seo.keywords) {
      children.push(makeParagraph(`  ${kw.word}：出现 ${kw.count} 次，密度 ${kw.density}%`));
    }
  }
  children.push(new Paragraph({ children: [], spacing: { after: convertInchesToTwip(0.1) } }));

  // ── Section 3: Readability ──
  children.push(makeParagraph('三、可读性分析', { bold: true, size: 28 }));
  children.push(makeParagraph(`综合评分：${readability.score} 分（${getScoreLabel(readability.score)}）`, {
    bold: true,
    color: readability.score >= 80 ? '16A34A' : readability.score >= 60 ? 'D97706' : 'DC2626',
  }));
  children.push(makeParagraph(`平均句长：${readability.avgSentenceLength} 字`));
  children.push(makeParagraph(`平均段落长度：${readability.avgParagraphLength} 字`));
  children.push(makeParagraph(`句子数量：${readability.sentenceCount} 句`));
  children.push(makeParagraph(`段落数量：${readability.paragraphCount} 段`));
  children.push(makeParagraph('评分明细：'));
  children.push(makeParagraph(`  句长合理性：${readability.sentenceLengthScore} 分`));
  children.push(makeParagraph(`  段落合理性：${readability.paragraphLengthScore} 分`));
  children.push(makeParagraph(`  句子丰富度：${readability.sentenceCountScore} 分`));
  children.push(makeParagraph(`  词汇多样性：${readability.vocabDiversityScore} 分`));
  children.push(new Paragraph({ children: [], spacing: { after: convertInchesToTwip(0.1) } }));

  // ── Section 4: AI Detection ──
  children.push(makeParagraph('四、AI 痕迹检测', { bold: true, size: 28 }));
  children.push(makeParagraph(`AI 痕迹评分：${aiDetection.score} 分`, {
    bold: true,
    color: aiDetection.score > 30 ? 'D97706' : '16A34A',
  }));
  children.push(makeParagraph(aiDetection.score > 30 ? '检测到较多 AI 常见用语，建议修改润色' : 'AI 痕迹较少，文章较为自然'));
  if (aiDetection.detectedPhrases.length > 0) {
    children.push(makeParagraph('检测到的 AI 常见用语：', { bold: true }));
    for (const p of aiDetection.detectedPhrases) {
      children.push(makeParagraph(`  「${p.phrase}」出现 ${p.count} 次`));
    }
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
  saveAs(blob, `${title || '文章'}_分析报告.docx`);
}

// ── Main Component ───────────────────────────────────────────────────
export function ContentAnalysis({ title, content }: ContentAnalysisProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = () => {
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    if (!plainText) {
      toast.error('请先写点内容再进行分析');
      return;
    }
    setAnalyzing(true);
    // Run analysis synchronously (pure string operations, no API call)
    try {
      const r = runAnalysis(title, content);
      setResult(r);
      toast.success('分析完成');
    } catch (e) {
      console.error('Analysis error:', e);
      toast.error('分析出错，请重试');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExport = async () => {
    if (!result) return;
    try {
      await exportAnalysisReport(title, result);
      toast.success('分析报告已下载');
    } catch (e) {
      console.error('Export error:', e);
      toast.error('导出失败，请重试');
    }
  };

  // No results yet — show start button
  if (!result) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="p-3 rounded-full bg-muted">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">文章智能分析</p>
            <p className="text-xs text-muted-foreground">
              从 SEO、可读性、AI 痕迹等维度全面分析你的文章
            </p>
          </div>
          <Button onClick={handleAnalyze} disabled={analyzing} className="w-full">
            {analyzing ? (
              <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> 分析中...</>
            ) : (
              <><Sparkles className="mr-1.5 h-4 w-4" /> 开始分析</>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { charCount, readingTime, seo, readability, aiDetection } = result;

  return (
    <div className="space-y-3">
      {/* Header with re-analyze and export buttons */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? (
            <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> 分析中...</>
          ) : (
            <><Sparkles className="mr-1.5 h-3.5 w-3.5" /> 重新分析</>
          )}
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={handleExport}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> 下载报告
        </Button>
      </div>

      {/* Section 1: Overview */}
      <Section icon={FileText} title="基本概况" defaultOpen={true}>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Type className="h-3 w-3" />
              <span className="text-[10px]">字数</span>
            </div>
            <div className="text-lg font-bold">{charCount}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Clock className="h-3 w-3" />
              <span className="text-[10px]">阅读时间</span>
            </div>
            <div className="text-lg font-bold">{readingTime}<span className="text-xs font-normal ml-0.5">分钟</span></div>
          </div>
        </div>
      </Section>

      {/* Section 2: SEO */}
      <Section
        icon={Search}
        title="SEO 分析"
        score={seo.keywordStatus.status === 'good' ? 85 : 50}
        scoreLabel={seo.keywordStatus.status === 'good' ? '良好' : '待优化'}
        defaultOpen={true}
      >
        <div className="space-y-2 pt-2">
          {[seo.title, seo.contentLength, seo.paragraphs, seo.hasImages, seo.firstParagraph, seo.keywordStatus].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              {item.status === 'good' ? (
                <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
              )}
              <span className={item.status === 'good' ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}>
                {item.message}
              </span>
            </div>
          ))}

          {seo.keywords.length > 0 && (
            <>
              <Separator className="my-2" />
              <div className="text-xs font-medium text-muted-foreground mb-1.5">关键词密度</div>
              {seo.keywords.map((kw) => (
                <div key={kw.word} className="flex items-center justify-between text-xs">
                  <span className="truncate max-w-[100px]">{kw.word}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{kw.count}次</span>
                    <span className={
                      parseFloat(kw.density) > 5 ? 'text-red-500' :
                      parseFloat(kw.density) >= 1.5 ? 'text-green-600 dark:text-green-400' :
                      'text-muted-foreground'
                    }>
                      {kw.density}%
                    </span>
                  </div>
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
        scoreLabel={`${readability.score}分 · ${getScoreLabel(readability.score)}`}
        defaultOpen={true}
      >
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>综合评分</span>
              <span className={`font-bold ${getScoreColor(readability.score)}`}>{readability.score}分</span>
            </div>
            <Progress value={readability.score} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">平均句长</span>
              <span>{readability.avgSentenceLength}字</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">平均段落</span>
              <span>{readability.avgParagraphLength}字</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">句子数</span>
              <span>{readability.sentenceCount}句</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">段落数</span>
              <span>{readability.paragraphCount}段</span>
            </div>
          </div>

          <Separator />
          <div className="text-xs font-medium text-muted-foreground mb-1">评分明细</div>
          <div className="space-y-1.5">
            {[
              { label: '句长合理性', score: readability.sentenceLengthScore },
              { label: '段落合理性', score: readability.paragraphLengthScore },
              { label: '句子丰富度', score: readability.sentenceCountScore },
              { label: '词汇多样性', score: readability.vocabDiversityScore },
            ].map((item) => (
              <div key={item.label} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className={getScoreColor(item.score)}>{item.score}分</span>
                </div>
                <Progress value={item.score} className="h-1" />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Section 4: AI Detection */}
      <Section
        icon={TrendingUp}
        title="AI 痕迹检测"
        score={100 - aiDetection.score}
        scoreLabel={aiDetection.score > 30 ? '偏高' : '正常'}
        defaultOpen={true}
      >
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              AI 痕迹评分
              {aiDetection.score > 30 && <AlertTriangle className="h-3 w-3 text-amber-500" />}
            </span>
            <span className={`font-bold ${aiDetection.score > 30 ? 'text-amber-600' : 'text-green-600'}`}>
              {aiDetection.score}分 · {aiDetection.score > 30 ? '偏高' : '正常'}
            </span>
          </div>
          <Progress value={aiDetection.score} className="h-2" />

          {aiDetection.score > 30 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              检测到较多 AI 常见用语，建议修改润色以提升文章自然度
            </p>
          )}

          {aiDetection.detectedPhrases.length > 0 && (
            <>
              <Separator className="my-1" />
              <div className="text-xs font-medium text-muted-foreground mb-1.5">
                检测到 {aiDetection.detectedPhrases.length} 个 AI 常见用语
              </div>
              <div className="flex flex-wrap gap-1">
                {aiDetection.detectedPhrases.map(({ phrase, count }) => (
                  <span
                    key={phrase}
                    className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded text-xs"
                  >
                    {phrase}{count > 1 ? ` ×${count}` : ''}
                  </span>
                ))}
              </div>
            </>
          )}

          {aiDetection.detectedPhrases.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>未检测到明显 AI 痕迹，文章较为自然</span>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
