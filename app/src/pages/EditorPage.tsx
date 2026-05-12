import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Save,
  Copy,
  Sparkles,
  Image as ImageIcon,
  AlignLeft,
  Download,
  Wand2,
  Loader2,
  ChevronLeft,
  Zap,
  Palette,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/stores/useAppStore';
import { RichTextEditor, type RichTextEditorHandle } from '@/components/editor/RichTextEditor';
import { FormattingPanel } from '@/components/editor/FormattingPanel';
import { PhonePreview } from '@/components/editor/PhonePreview';
import { WritingTemplates } from '@/components/editor/WritingTemplates';
import { ContentAnalysis } from '@/components/editor/ContentAnalysis';
import { VersionHistory } from '@/components/editor/VersionHistory';
import { ExportDialog } from '@/components/editor/ExportDialog';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useArticleActions } from '@/hooks/useArticleActions';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import type { HotTopic, ArticleVersion } from '@/types';

export function EditorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings, currentArticle, loadArticle, addArticleVersion } = useAppStore();
  const editorRef = useRef<RichTextEditorHandle>(null);
  const abortRef = useRef<AbortController | null>(null);

  const topic = location.state?.topic as HotTopic | undefined;
  const routeArticleId = location.state?.articleId as string | undefined;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(settings.defaultWordCount);
  const [imagePrompt, setImagePrompt] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [articleId, setArticleId] = useState<string | undefined>(undefined);
  const [activeSideTab, setActiveSideTab] = useState<string>('ai');

  const { saveStatus, saveNow } = useAutoSave(title, content, wordCount);
  const { handleCopy, handleCopyForWechat } = useArticleActions(title, content, topic);
  const { isGenerating, isGeneratingImage, handleGenerate, handleGenerateImage } = useAIGeneration();

  // 统一初始化：currentArticle 为唯一数据源，localStorage 仅为首次加载 fallback
  const initKey = routeArticleId || currentArticle?.id || 'new';
  const prevInitKey = useRef<string>('');

  useEffect(() => {
    if (prevInitKey.current === initKey) return;
    prevInitKey.current = initKey;

    // 取消前一个加载
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (topic) {
      const id = uuidv4();
      setArticleId(id);
      setTitle(`关于"${topic.title}"的公众号文章`);
      setAdditionalPrompt(`请围绕热点话题"${topic.title}"写一篇公众号文章`);
    } else if (routeArticleId) {
      // 通过 store 加载，而非直接读 location.state.article
      const found = loadArticle(routeArticleId);
      if (!controller.signal.aborted && found) {
        setArticleId(found.id);
        setTitle(found.title);
        setContent(found.content);
        setWordCount(found.wordCount);
      }
    } else if (currentArticle) {
      // currentArticle 来自 store（已持久化到 localStorage），作为唯一数据源
      setArticleId(currentArticle.id);
      setTitle(currentArticle.title);
      setContent(currentArticle.content);
      setWordCount(currentArticle.wordCount);
    } else {
      setArticleId(uuidv4());
    }

    return () => controller.abort();
  }, [initKey, topic]);

  const handleSaveWithVersionCallback = useCallback(() => {
    saveNow();
    toast.success('保存成功', { description: '文章已保存到本地' });
    if (articleId && content) {
      const version: ArticleVersion = {
        id: uuidv4(),
        articleId,
        title,
        content,
        wordCount: content.replace(/<[^>]*>/g, '').length,
        createdAt: new Date().toISOString(),
      };
      addArticleVersion(version);
    }
  }, [saveNow, articleId, title, content, addArticleVersion]);

  // 全局快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveWithVersionCallback();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isGenerating) onGenerate();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSaveWithVersionCallback, isGenerating]);

  const onGenerate = async () => {
    // 保存内容快照，失败时恢复
    const previousContent = content;
    // 清空编辑器准备接收流式内容
    setContent('');
    const prompt = `
      ${additionalPrompt}
      要求：
      1. 字数约${wordCount}字
      2. 适合公众号阅读的风格
      3. 段落清晰，有小标题
      4. 内容有深度，能引发读者共鸣
      5. 开头要有吸引力，结尾要有升华
    `;
    try {
      await handleGenerate(prompt, wordCount, (chunk) => {
        // 使用 appendContent 追加到编辑器末尾，不重置光标
        if (editorRef.current) {
          editorRef.current.appendContent(chunk);
        } else {
          // fallback: 如果 ref 不可用，走 state
          setContent((prev) => prev + chunk);
        }
      });
    } catch {
      // 失败时恢复之前的内容
      setContent(previousContent);
    }
  };

  const onGenerateImage = async () => {
    const imageUrl = await handleGenerateImage(imagePrompt);
    if (imageUrl) {
      // 通过 TipTap 命令链插入图片，支持撤销
      const editor = editorRef.current?.getEditor();
      if (editor) {
        editor.chain().focus().setImage({ src: imageUrl, alt: imagePrompt }).run();
        // 同步到 React state
        setContent(editor.getHTML());
      } else {
        // fallback
        const imageHtml = `<p><img src="${imageUrl}" alt="${imagePrompt}" style="max-width: 100%; height: auto;" /></p>`;
        setContent((prev) => prev + imageHtml);
      }
      setShowImageDialog(false);
    }
  };

  const handleInsertTemplate = (templateContent: string) => {
    setContent((prev) => prev + `<p>${templateContent.replace(/\n/g, '<br/>')}</p>`);
  };

  const handleRestoreVersion = (version: ArticleVersion) => {
    setTitle(version.title);
    setContent(version.content);
    toast.success('已恢复到历史版本');
  };

  const charCount = content.replace(/<[^>]*>/g, '').length;

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* ========== 顶部栏 ========== */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b rounded-t-lg">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="relative w-80">
            <Input
              placeholder="输入文章标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
              className="text-base font-medium border-none shadow-none focus-visible:ring-0 px-0 pr-12"
            />
            <span className={`absolute right-0 top-1/2 -translate-y-1/2 text-xs tabular-nums ${
              title.length > 30 ? 'text-red-500' : title.length >= 25 ? 'text-amber-500' : 'text-muted-foreground'
            }`}>
              {title.length}/30
            </span>
          </div>
          <Badge
            variant={saveStatus === 'saved' ? 'default' : saveStatus === 'saving' ? 'outline' : 'secondary'}
            className={`text-xs ${saveStatus === 'unsaved' ? 'text-amber-600 dark:text-amber-400' : ''}`}
          >
            {saveStatus === 'saving' ? '保存中...' : saveStatus === 'unsaved' ? '未保存' : '已保存'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleSaveWithVersionCallback}>
            <Save className="mr-1.5 h-3.5 w-3.5" /> 保存
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Copy className="mr-1.5 h-3.5 w-3.5" /> 复制
          </Button>
          <Button size="sm" onClick={handleCopyForWechat} className="bg-green-600 hover:bg-green-700">
            <Download className="mr-1.5 h-3.5 w-3.5" /> 复制到公众号
          </Button>
        </div>
      </div>

      {/* ========== 主体区域 ========== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ===== 左侧：编辑器 ===== */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <RichTextEditor
              ref={editorRef}
              content={content}
              onChange={setContent}
              onSave={handleSaveWithVersionCallback}
              placeholder="开始写作...（支持拖拽图片到编辑器）"
            />
          </div>
          {/* 底部状态栏 */}
          <div className="flex items-center justify-between px-4 py-1.5 text-xs text-muted-foreground border-t bg-muted/30">
            <div className="flex items-center gap-4">
              <span className="tabular-nums">{charCount.toLocaleString()} 字</span>
              <span className="opacity-40">·</span>
              <span>阅读 {Math.max(1, Math.ceil(charCount / 500))} 分钟</span>
              <span className="opacity-40">·</span>
              <div className="flex items-center gap-1.5">
                <div className="w-20 h-1.5 rounded-full bg-muted-foreground/20 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      charCount >= 3000 ? 'bg-green-500' : charCount >= 1500 ? 'bg-blue-500' : 'bg-muted-foreground/40'
                    }`}
                    style={{ width: `${Math.min(100, (charCount / 3000) * 100)}%` }}
                  />
                </div>
                <span className="tabular-nums">{Math.round((charCount / 3000) * 100)}%</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1 py-0.5 rounded text-[10px] bg-muted">Ctrl+S</kbd>
              <span>保存</span>
              <kbd className="px-1 py-0.5 rounded text-[10px] bg-muted">Ctrl+Enter</kbd>
              <span>生成</span>
              <kbd className="px-1 py-0.5 rounded text-[10px] bg-muted">Ctrl+B</kbd>
              <span>加粗</span>
              <kbd className="px-1 py-0.5 rounded text-[10px] bg-muted">Ctrl+I</kbd>
              <span>斜体</span>
            </div>
          </div>
        </div>

        {/* ===== 右侧面板 ===== */}
        <div className="w-80 border-l bg-card overflow-y-auto">
          <Tabs value={activeSideTab} onValueChange={setActiveSideTab} className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-10 rounded-none border-b bg-transparent">
              <TabsTrigger value="ai" className="text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                <Sparkles className="h-3.5 w-3.5" />
              </TabsTrigger>
              <TabsTrigger value="tools" className="text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                <Zap className="h-3.5 w-3.5" />
              </TabsTrigger>
              <TabsTrigger value="format" className="text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                <Palette className="h-3.5 w-3.5" />
              </TabsTrigger>
              <TabsTrigger value="analysis" className="text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                <BarChart3 className="h-3.5 w-3.5" />
              </TabsTrigger>
            </TabsList>

            {/* ---- AI 写作 ---- */}
            <TabsContent value="ai" className="p-3 space-y-3 mt-0">
              {/* AI 生成 */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Wand2 className="h-3.5 w-3.5" /> AI 写作
                  </Label>
                  <span className="text-xs text-muted-foreground">{wordCount} 字</span>
                </div>
                <Slider
                  value={[wordCount]}
                  onValueChange={([v]) => setWordCount(v)}
                  min={500}
                  max={5000}
                  step={100}
                />
                <Textarea
                  placeholder="补充要求（选填）..."
                  value={additionalPrompt}
                  onChange={(e) => setAdditionalPrompt(e.target.value)}
                  className="min-h-[50px] text-sm resize-none"
                />
                <Button
                  className="w-full"
                  size="sm"
                  onClick={onGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> 生成中...</>
                  ) : (
                    <><Wand2 className="mr-1.5 h-3.5 w-3.5" /> AI 生成文章</>
                  )}
                </Button>
              </div>

              <Separator />

              {/* AI 配图 */}
              <div className="space-y-2.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" /> AI 配图
                </Label>
                <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" size="sm">
                      <ImageIcon className="mr-1.5 h-3.5 w-3.5" /> 生成配图
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>AI 生成图片</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="描述您想要的图片..."
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                      />
                      <Button className="w-full" onClick={onGenerateImage} disabled={isGeneratingImage}>
                        {isGeneratingImage ? (
                          <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> 生成中...</>
                        ) : '生成图片'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Separator />

              {/* 快捷操作 */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">快捷操作</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs justify-start"
                    onClick={() => {
                      if (content) {
                        setAdditionalPrompt('请优化以下文章，去除AI痕迹，使其更自然');
                        onGenerate();
                      } else {
                        toast.error('请先写点内容');
                      }
                    }}
                  >
                    <Sparkles className="mr-1 h-3 w-3" /> 去AI味
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs justify-start"
                    onClick={() => {
                      if (content) {
                        setAdditionalPrompt('请为以下文章生成一个简洁的摘要，100字以内');
                        onGenerate();
                      } else {
                        toast.error('请先写点内容');
                      }
                    }}
                  >
                    <AlignLeft className="mr-1 h-3 w-3" /> 生成摘要
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs justify-start"
                    onClick={() => navigate('/images')}
                  >
                    <ImageIcon className="mr-1 h-3 w-3" /> 图片素材
                  </Button>
                  <WritingTemplates onInsert={handleInsertTemplate} />
                </div>
              </div>
            </TabsContent>

            {/* ---- 工具 ---- */}
            <TabsContent value="tools" className="p-3 space-y-3 mt-0">
              <PhonePreview title={title} content={content} />
              <VersionHistory articleId={articleId} onRestore={handleRestoreVersion} />
              <ExportDialog title={title} content={content} />
            </TabsContent>

            {/* ---- 排版 ---- */}
            <TabsContent value="format" className="p-3 mt-0">
              <FormattingPanel content={content} onApplyFormat={setContent} />
            </TabsContent>

            {/* ---- 分析 ---- */}
            <TabsContent value="analysis" className="p-3 space-y-3 mt-0">
              <ContentAnalysis title={title} content={content} />
            </TabsContent>
          </Tabs>

          {/* 热点信息 */}
          {topic && (
            <div className="p-3 border-t">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="secondary" className="text-[10px]">{topic.source}</Badge>
                  <span className="text-[10px] text-muted-foreground">热度 {topic.hot}</span>
                </div>
                <p className="text-xs font-medium mb-1.5">{topic.title}</p>
                <a href={topic.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">
                  查看原文 →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
