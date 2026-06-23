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
import type { HotTopic, ArticleVersion, Article } from '@/types';

export function EditorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings, currentArticle, setCurrentArticle, loadArticle, addArticleVersion } = useAppStore();
  const editorRef = useRef<RichTextEditorHandle>(null);
  const abortRef = useRef<AbortController | null>(null);
  const titleRef = useRef<string>('');
  const onGenerateRef = useRef<(() => Promise<void>) | null>(null);

  const topic = location.state?.topic as HotTopic | undefined;
  const routeArticleId = location.state?.articleId as string | undefined;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(settings.defaultWordCount || 1500);
  const [imagePrompt, setImagePrompt] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [activeSideTab, setActiveSideTab] = useState<string>('ai');

  const { saveStatus, saveNow } = useAutoSave(title, content, wordCount);
  const { handleCopy, handleCopyForWechat } = useArticleActions(title, content);
  const { isGenerating, isGeneratingImage, handleGenerate, handleGenerateImage } = useAIGeneration();

  // 统一初始化：currentArticle 为唯一数据源，localStorage 仅为首次加载 fallback
  const initKey = routeArticleId || currentArticle?.id || 'new';
  const prevInitKey = useRef<string>('');
  // topic 初始化单独追踪，因为 topic 分支会调用 setCurrentArticle 导致 initKey 变化
  const topicInitRef = useRef<string>('');

  useEffect(() => {
    // 取消前一个加载
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (topic) {
      // topic 分支：用 topic 标题做 guard，避免 setCurrentArticle 导致 initKey 变化后重复执行
      if (topicInitRef.current === topic.title) return;
      topicInitRef.current = topic.title;
      setContent('');
      const newArticle: Article = {
        id: uuidv4(),
        title: `关于"${topic.title}"的公众号文章`,
        content: '',
        wordCount,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft',
      };
      setCurrentArticle(newArticle);
      setTitle(newArticle.title);
      setAdditionalPrompt(`请围绕热点话题"${topic.title}"写一篇公众号文章`);
    } else {
      // 非 topic 分支：用 initKey 做 guard
      if (prevInitKey.current === initKey) return;
      prevInitKey.current = initKey;

      if (routeArticleId) {
        const found = loadArticle(routeArticleId);
        if (!controller.signal.aborted && found) {
          setTitle(found.title);
          setContent(found.content);
          setWordCount(found.wordCount);
        }
      } else if (currentArticle) {
        setTitle(currentArticle.title);
        setContent(currentArticle.content);
        setWordCount(currentArticle.wordCount);
      } else {
        const newArticle: Article = {
          id: uuidv4(),
          title: '',
          content: '',
          wordCount,
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        };
        setCurrentArticle(newArticle);
      }
    }

    return () => controller.abort();
  }, [initKey, topic]);

  const handleSaveWithVersionCallback = useCallback(() => {
    saveNow();
    toast.success('保存成功', { description: '文章已保存到本地' });
    // Read latest values from store and editor ref to avoid stale closures
    const storeArticleId = useAppStore.getState().currentArticle?.id;
    const latestContent = editorRef.current?.getEditor()?.getHTML() || '';
    if (storeArticleId && latestContent) {
      const version: ArticleVersion = {
        id: uuidv4(),
        articleId: storeArticleId,
        title: titleRef.current,
        content: latestContent,
        wordCount: latestContent.replace(/<[^>]*>/g, '').length,
        createdAt: new Date().toISOString(),
      };
      addArticleVersion(version);
    }
  }, [saveNow, addArticleVersion]);

  // 全局快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveWithVersionCallback();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isGenerating) onGenerateRef.current?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSaveWithVersionCallback, isGenerating]);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  onGenerateRef.current = async () => {
    // 保存内容快照，失败时恢复（从编辑器实时读取，不依赖闭包）
    const previousContent = editorRef.current?.getEditor()?.getHTML() || content;
    // 使用 clearContent 清空编辑器准备接收流式内容
    editorRef.current?.clearContent();
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
        if (editorRef.current) {
          editorRef.current.appendContent(chunk);
        }
      });
    } catch (error) {
      // 恢复编辑器内容
      const editor = editorRef.current?.getEditor();
      if (editor) {
        editor.commands.setContent(previousContent);
      }
      setContent(previousContent);
      const errorMessage = error instanceof Error ? error.message : 'AI 生成失败，请稍后重试';
      toast.error('生成失败', { description: errorMessage });
    }
  };
  const onGenerate = useCallback(() => onGenerateRef.current?.(), []);

  // 基于现有内容进行 AI 改写（去AI味、生成摘要等）
  const onRefineContent = useCallback(async (instruction: string) => {
    const currentContent = editorRef.current?.getEditor()?.getHTML() || content;
    if (!currentContent.trim()) {
      toast.error('请先写点内容');
      return;
    }
    const previousContent = currentContent;
    editorRef.current?.clearContent();
    const prompt = `
      以下是原文内容：
      ${currentContent.replace(/<[^>]*>/g, '\n')}

      请根据以下要求处理上述内容：
      ${instruction}

      要求：
      1. 直接输出处理后的内容，不要加任何说明
      2. 适合公众号阅读的风格
      3. 保持原文的核心观点和信息
    `;
    try {
      await handleGenerate(prompt, wordCount, (chunk) => {
        if (editorRef.current) {
          editorRef.current.appendContent(chunk);
        }
      });
    } catch (error) {
      // 恢复编辑器内容
      const editor = editorRef.current?.getEditor();
      if (editor) {
        editor.commands.setContent(previousContent);
      }
      setContent(previousContent);
      const errorMessage = error instanceof Error ? error.message : 'AI 处理失败，请稍后重试';
      toast.error('处理失败', { description: errorMessage });
    }
  }, [wordCount, handleGenerate]);

  const onGenerateImage = async () => {
    try {
      const imageUrl = await handleGenerateImage(imagePrompt);
      if (imageUrl) {
        // 通过 TipTap 命令链插入图片，支持撤销
        const editor = editorRef.current?.getEditor();
        if (editor) {
          editor.chain().focus().setImage({ src: imageUrl, alt: imagePrompt }).run();
          // 同步到 React state
          setContent(editor.getHTML());
        } else {
          // fallback: 使用 DOM API 安全创建图片元素
          const sanitizedUrl = encodeURI(imageUrl);
          const sanitizedAlt = imagePrompt.replace(/[<>"'&]/g, (char) => {
            const entities: Record<string, string> = {
              '<': '&lt;',
              '>': '&gt;',
              '"': '&quot;',
              "'": '&#x27;',
              '&': '&amp;',
            };
            return entities[char] || char;
          });
          const imageHtml = `<p><img src="${sanitizedUrl}" alt="${sanitizedAlt}" style="max-width: 100%; height: auto;" /></p>`;
          setContent((prev) => prev + imageHtml);
        }
        setShowImageDialog(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '图片生成失败，请稍后重试';
      toast.error('图片生成失败', { description: errorMessage });
    }
  };

  const handleInsertTemplate = (templateContent: string) => {
    const editor = editorRef.current?.getEditor();
    if (editor) {
      const html = `<p>${templateContent.replace(/\n/g, '<br/>')}</p>`;
      editor.chain().focus().insertContent(html).run();
      setContent(editor.getHTML());
    } else {
      setContent((prev) => prev + `<p>${templateContent.replace(/\n/g, '<br/>')}</p>`);
    }
  };

  const handleRestoreVersion = (version: ArticleVersion) => {
    setTitle(version.title);
    setContent(version.content);
    // 更新 currentArticle 的 updatedAt，避免数据不一致
    if (currentArticle) {
      setCurrentArticle({
        ...currentArticle,
        title: version.title,
        content: version.content,
        updatedAt: new Date().toISOString(),
      });
    }
    toast.success('已恢复到历史版本');
  };

  const charCount = content.replace(/<[^>]*>/g, '').length;

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* ========== 顶部栏 ========== */}
      <div className="flex items-center justify-between px-6 py-3 bg-card/80 backdrop-blur-sm border-b">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)} 
            className="h-9 w-9 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="relative flex-1 min-w-[300px] max-w-[500px]">
            <Input
              placeholder="输入文章标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={30}
              className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 pr-14 bg-transparent placeholder:text-muted-foreground/50"
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className={`text-xs tabular-nums px-2 py-1 rounded-md ${
                title.length > 30 
                  ? 'text-red-500 bg-red-50 dark:bg-red-950/30' 
                  : title.length >= 25 
                    ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' 
                    : 'text-muted-foreground bg-muted/50'
              }`}>
                {title.length}/30
              </span>
            </div>
          </div>
          <Badge
            variant={saveStatus === 'saved' ? 'default' : saveStatus === 'saving' ? 'outline' : 'secondary'}
            className={`text-xs px-3 py-1 transition-all duration-300 ${
              saveStatus === 'saved' 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                : saveStatus === 'saving' 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
            }`}
          >
            {saveStatus === 'saving' ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                保存中...
              </span>
            ) : saveStatus === 'unsaved' ? '未保存' : '已保存'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSaveWithVersionCallback}
            className="h-9 px-3 rounded-lg hover:bg-muted transition-colors"
          >
            <Save className="mr-1.5 h-4 w-4" /> 保存
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCopy}
            className="h-9 px-3 rounded-lg hover:bg-muted transition-colors"
          >
            <Copy className="mr-1.5 h-4 w-4" /> 复制
          </Button>
          <Button 
            size="sm" 
            onClick={handleCopyForWechat} 
            className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all duration-200 hover:shadow-md hover:shadow-emerald-600/30"
          >
            <Download className="mr-1.5 h-4 w-4" /> 复制到公众号
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
          <div className="flex items-center justify-between px-6 py-2 text-xs text-muted-foreground border-t bg-muted/20 backdrop-blur-sm">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <span className="tabular-nums font-medium">{charCount.toLocaleString()}</span>
                <span>字</span>
              </div>
              <div className="w-px h-3 bg-border/50" />
              <div className="flex items-center gap-2">
                <span>阅读</span>
                <span className="tabular-nums font-medium">{Math.max(1, Math.ceil(charCount / 500))}</span>
                <span>分钟</span>
              </div>
              <div className="w-px h-3 bg-border/50" />
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 rounded-full bg-muted-foreground/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      charCount >= 3000 
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                        : charCount >= 1500 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-400' 
                          : 'bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/20'
                    }`}
                    style={{ width: `${Math.min(100, (charCount / 3000) * 100)}%` }}
                  />
                </div>
                <span className="tabular-nums font-medium min-w-[2.5rem] text-right">
                  {Math.round((charCount / 3000) * 100)}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-background border border-border/50 font-mono">⌘S</kbd>
                <span>保存</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-background border border-border/50 font-mono">⌘↵</kbd>
                <span>生成</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== 右侧面板 ===== */}
        <div className="w-80 border-l bg-card/50 backdrop-blur-sm overflow-y-auto">
          <Tabs value={activeSideTab} onValueChange={setActiveSideTab} className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-12 rounded-none border-b bg-transparent p-1">
              <TabsTrigger 
                value="ai" 
                className="flex flex-col items-center gap-1 text-[10px] rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-primary/5 transition-all duration-200"
              >
                <Sparkles className="h-4 w-4" />
                <span>AI 写作</span>
              </TabsTrigger>
              <TabsTrigger 
                value="tools" 
                className="flex flex-col items-center gap-1 text-[10px] rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-primary/5 transition-all duration-200"
              >
                <Zap className="h-4 w-4" />
                <span>工具</span>
              </TabsTrigger>
              <TabsTrigger 
                value="format" 
                className="flex flex-col items-center gap-1 text-[10px] rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-primary/5 transition-all duration-200"
              >
                <Palette className="h-4 w-4" />
                <span>排版</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analysis" 
                className="flex flex-col items-center gap-1 text-[10px] rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-primary/5 transition-all duration-200"
              >
                <BarChart3 className="h-4 w-4" />
                <span>分析</span>
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
                    onClick={() => onRefineContent('优化以下文章，去除AI痕迹，使其读起来更自然、更有人味，像真人写的一样')}
                  >
                    <Sparkles className="mr-1 h-3 w-3" /> 去AI味
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs justify-start"
                    onClick={() => onRefineContent('为以下文章生成一个简洁的摘要，100字以内，突出核心观点')}
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
              <VersionHistory articleId={currentArticle?.id} onRestore={handleRestoreVersion} />
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
