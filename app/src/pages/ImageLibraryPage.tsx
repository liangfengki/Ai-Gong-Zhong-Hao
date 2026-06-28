import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  Copy,
  Loader2,
  Image,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { searchAllImages } from '@/services/api';
import { useAppStore } from '@/stores/useAppStore';
import type { ImageAsset } from '@/types';

type ImageOrientation = 'landscape' | 'portrait' | 'squarish';

const sourceColors: Record<string, string> = {
  unsplash: 'bg-black',
  pexels: 'bg-green-600',
  pixabay: 'bg-yellow-500',
};

const sourceNames: Record<string, string> = {
  unsplash: 'Unsplash',
  pexels: 'Pexels',
  pixabay: 'Pixabay',
};

// 分类标签，带图标和描述
const categoryTags = [
  { keyword: '风景', label: '风景', emoji: '🏔️' },
  { keyword: '科技', label: '科技', emoji: '💻' },
  { keyword: '美食', label: '美食', emoji: '🍕' },
  { keyword: '城市', label: '城市', emoji: '🏙️' },
  { keyword: '自然', label: '自然', emoji: '🌿' },
  { keyword: '商务', label: '商务', emoji: '💼' },
  { keyword: '教育', label: '教育', emoji: '📚' },
  { keyword: '健康', label: '健康', emoji: '🏥' },
  { keyword: '旅行', label: '旅行', emoji: '✈️' },
  { keyword: '办公', label: '办公', emoji: '🖥️' },
  { keyword: '植物', label: '植物', emoji: '🌻' },
  { keyword: '动物', label: '动物', emoji: '🐾' },
  { keyword: '建筑', label: '建筑', emoji: '🏛️' },
  { keyword: '人物', label: '人物', emoji: '👤' },
  { keyword: '抽象', label: '抽象', emoji: '🎨' },
  { keyword: '背景', label: '背景', emoji: '🖼️' },
];

// 默认加载的关键词
const DEFAULT_KEYWORD = '风景';

export function ImageLibraryPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [previewImage, setPreviewImage] = useState<ImageAsset | null>(null);
  const [orientation, setOrientation] = useState<string>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<string>('api');
  const [activeCategory, setActiveCategory] = useState<string>(DEFAULT_KEYWORD);
  const hasLoadedDefaultImagesRef = useRef(false);

  const runSearch = useCallback(async (
    query: string,
    {
      nextPage = 1,
      append = false,
      nextOrientation = 'all',
    }: {
      nextPage?: number;
      append?: boolean;
      nextOrientation?: string;
    } = {}
  ) => {
    const q = query;
    if (!q.trim()) return;
    
    if (!append) {
      setSearchQuery(q);
      setActiveCategory(q);
    }
    
    setLoading(true);
    
    try {
      const result = await searchAllImages({
        query: q,
        page: nextPage,
        pageSize: 30,
        orientation: nextOrientation === 'all' ? undefined : (nextOrientation as ImageOrientation),
      });
      
      if (append) {
        setImages((prev) => [...prev, ...result.images]);
      } else {
        setImages(result.images);
      }
      setPage(nextPage);
      
      setImageSource(result.sources.includes('loremflickr-fallback') ? 'loremflickr' : 'api');
    } catch {
      toast.error('搜索失败', {
        description: '请稍后重试',
      });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  // 页面加载时自动搜索默认关键词
  useEffect(() => {
    if (hasLoadedDefaultImagesRef.current) return;
    hasLoadedDefaultImagesRef.current = true;
    runSearch(DEFAULT_KEYWORD);
  }, [runSearch]);

  const handleSearch = useCallback(async (query?: string) => {
    const q = query || searchQuery;
    await runSearch(q, { nextPage: 1, nextOrientation: orientation });
  }, [runSearch, searchQuery, orientation]);

  const handleLoadMore = async () => {
    await runSearch(searchQuery || activeCategory || DEFAULT_KEYWORD, {
      nextPage: page + 1,
      append: true,
      nextOrientation: orientation,
    });
  };

  const handleCategoryClick = (keyword: string) => {
    runSearch(keyword, { nextPage: 1, nextOrientation: orientation });
  };

  const handleCopyImage = async (image: ImageAsset) => {
    try {
      const html = `<img src="${image.url}" alt="${image.alt}" style="max-width: 100%; height: auto;" />`;
      
      // 使用 Clipboard API 同时写入 HTML 和纯文本格式
      if (navigator.clipboard.write) {
        const htmlBlob = new Blob([html], { type: 'text/html' });
        const textBlob = new Blob([image.url], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob,
          }),
        ]);
      } else {
        // 降级方案：使用 writeText
        await navigator.clipboard.writeText(html);
      }
      
      toast.success('复制成功', {
        description: '图片已复制，可直接粘贴到编辑器（Ctrl+V）',
      });
    } catch {
      try {
        await navigator.clipboard.writeText(image.url);
        toast.success('已复制图片链接');
      } catch {
        toast.error('复制失败');
      }
    }
  };

  const handleInsertToEditor = (image: ImageAsset) => {
    // 通过 store 传递图片到编辑器（CustomEvent 在编辑器卸载时无法工作）
    useAppStore.getState().addPendingImageInsert({ url: image.url, alt: image.alt });
    toast.success('图片已发送到编辑器', {
      description: '已切回编辑器并自动插入图片',
    });
    setPreviewImage(null);
    navigate('/editor');
  };

  const handleDownload = async (image: ImageAsset) => {
    setDownloadingId(image.id);
    const downloadSource = image.downloadUrl || image.url;
    try {
      const res = await fetch(downloadSource, { mode: 'cors' });
      if (!res.ok) throw new Error('下载失败');
      const blob = await res.blob();
      const ext = res.headers.get('content-type')?.includes('png') ? 'png' : 'jpg';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${image.source}-${image.id}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('下载成功');
    } catch {
      const a = document.createElement('a');
      a.href = downloadSource;
      a.download = `${image.source}-${image.id}.jpg`;
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.info('已打开图片链接', {
        description: '浏览器无法直接下载时，可在新页面手动保存图片',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">图片素材库</h1>
          <p className="text-muted-foreground mt-1">
            免费无版权图片，点击预览，一键复制到文章
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">热门推荐</span>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索图片，例如：风景、科技、美食..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 h-11"
          />
        </div>
        <Select value={orientation} onValueChange={setOrientation}>
          <SelectTrigger className="w-[120px] h-11">
            <SelectValue placeholder="方向" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="landscape">横版</SelectItem>
            <SelectItem value="portrait">竖版</SelectItem>
            <SelectItem value="squarish">方形</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => handleSearch()} disabled={loading} className="h-11 px-6">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          搜索
        </Button>
      </div>

      {/* Category Tags */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">分类：</span>
          <div className="flex flex-wrap gap-2">
            {categoryTags.map((tag) => (
              <Button
                key={tag.keyword}
                variant={activeCategory === tag.keyword ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryClick(tag.keyword)}
                className="h-8 px-3 gap-1.5 transition-all"
                disabled={loading}
              >
                <span>{tag.emoji}</span>
                <span>{tag.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Image Sources */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">图片来源：</span>
        {imageSource === 'loremflickr' ? (
          <Badge className="bg-teal-600 text-white">免费图片源</Badge>
        ) : (
          <>
            <Badge className={`${sourceColors.unsplash} text-white`}>Unsplash</Badge>
            <Badge className={`${sourceColors.pexels} text-white`}>Pexels</Badge>
            <Badge className={`${sourceColors.pixabay} text-white`}>Pixabay</Badge>
          </>
        )}
      </div>

      {/* Images Grid */}
      {initialLoading || (loading && images.length === 0) ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">正在加载热门图片...</span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <CardContent className="p-2">
                  <Skeleton className="h-3 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : images.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              共找到 <span className="font-medium text-foreground">{images.length}</span> 张图片
              {activeCategory && (
                <span className="ml-2">
                  关键词：<Badge variant="secondary" className="ml-1">{activeCategory}</Badge>
                </span>
              )}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {images.map((image) => (
              <Card
                key={image.id}
                className="group overflow-hidden border-0 bg-muted/50 transition-all hover:scale-[1.02] hover:shadow-xl"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <button
                    type="button"
                    aria-label={`预览图片：${image.alt}`}
                    className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    onClick={() => setPreviewImage(image)}
                  >
                    <span className="sr-only">预览图片：{image.alt}</span>
                  </button>
                  <img
                    src={image.thumbUrl}
                    alt={image.alt}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7lm77niYc8L3RleHQ+PC9zdmc+';
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 z-20 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center justify-between">
                      <Badge className={`${sourceColors[image.source] || 'bg-gray-500'} text-white text-xs`}>
                        {sourceNames[image.source] || image.source}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8 bg-white/90 hover:bg-white"
                          aria-label="复制图片"
                          title="复制图片"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyImage(image);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8 bg-emerald-500/90 hover:bg-emerald-500 text-white"
                          aria-label="插入到编辑器"
                          title="插入到编辑器"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInsertToEditor(image);
                          }}
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8 bg-white/90 hover:bg-white"
                          aria-label="下载图片"
                          title="下载图片"
                          disabled={downloadingId === image.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(image);
                          }}
                        >
                          {downloadingId === image.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <CardContent className="p-2">
                  <p className="text-xs text-muted-foreground truncate">
                    {image.author || '未知作者'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <Button 
              variant="outline" 
              onClick={handleLoadMore}
              disabled={loading}
              className="px-8"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 加载中...</>
              ) : '加载更多'}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-6 mb-6">
            <Image className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">搜索免费图片</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            输入关键词搜索来自 Unsplash、Pexels、Pixabay 的免费图片，支持中文搜索
          </p>
          <div className="flex flex-wrap gap-2 justify-center max-w-lg">
            {categoryTags.slice(0, 8).map((tag) => (
              <Button
                key={tag.keyword}
                variant="outline"
                size="sm"
                onClick={() => handleCategoryClick(tag.keyword)}
                className="gap-1.5"
              >
                <span>{tag.emoji}</span>
                <span>{tag.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden max-sm:w-[calc(100vw-2rem)] max-sm:p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>图片预览</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => previewImage && handleCopyImage(previewImage)}
                >
                  <Copy className="mr-1 h-4 w-4" />
                  复制
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={downloadingId === previewImage?.id}
                  onClick={() => previewImage && handleDownload(previewImage)}
                >
                  {downloadingId === previewImage?.id ? (
                    <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> 下载中...</>
                  ) : (
                    <><Download className="mr-1 h-4 w-4" /> 下载原图</>
                  )}
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              查看图片大图，并可复制、下载或插入到当前文章。
            </DialogDescription>
          </DialogHeader>
          {previewImage && (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-lg bg-muted">
                <img
                  src={previewImage.url}
                  alt={previewImage.alt}
                  className="w-full max-h-[60vh] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = previewImage.thumbUrl;
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{previewImage.author || '未知作者'}</p>
                  <p className="text-sm text-muted-foreground">
                    来源: {sourceNames[previewImage.source] || previewImage.source}
                  </p>
                  {previewImage.alt && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {previewImage.alt}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => previewImage && handleCopyImage(previewImage)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    复制
                  </Button>
                  <Button 
                    variant="default"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => previewImage && handleInsertToEditor(previewImage)}
                  >
                    <Image className="mr-2 h-4 w-4" />
                    插入到编辑器
                  </Button>
                  <Button
                    disabled={downloadingId === previewImage?.id}
                    onClick={() => previewImage && handleDownload(previewImage)}
                  >
                    {downloadingId === previewImage?.id ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 下载中...</>
                    ) : (
                      <><Download className="mr-2 h-4 w-4" /> 下载原图</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
