import { useState } from 'react';
import {
  Search,
  Download,
  Copy,
  Loader2,
  Image,
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { searchAllImages } from '@/services/api';
import type { ImageAsset } from '@/types';

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

// 预设关键词
const presetKeywords = [
  '风景', '科技', '美食', '城市', '自然', '商务', '教育', '健康',
  '旅行', '办公', '植物', '动物', '建筑', '人物', '抽象', '背景'
];

export function ImageLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [previewImage, setPreviewImage] = useState<ImageAsset | null>(null);
  const [orientation, setOrientation] = useState<string>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleSearch = async (query?: string) => {
    const q = query || searchQuery;
    if (!q.trim()) return;
    
    setSearchQuery(q);
    setLoading(true);
    setPage(1);
    
    try {
      const results = await searchAllImages({
        query: q,
        page: 1,
        pageSize: 30,
        orientation: orientation === 'all' ? undefined : orientation as any,
      });
      setImages(results);
    } catch (error) {
      toast.error('搜索失败', {
        description: '请稍后重试',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoading(true);
    
    try {
      const results = await searchAllImages({
        query: searchQuery,
        page: nextPage,
        pageSize: 30,
      });
      setImages((prev) => [...prev, ...results]);
    } catch (error) {
      console.error('加载更多失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyImage = async (image: ImageAsset) => {
    try {
      // 复制图片HTML格式，方便直接粘贴到编辑器
      const html = `<img src="${image.url}" alt="${image.alt}" style="max-width: 100%; height: auto;" />`;
      await navigator.clipboard.writeText(html);
      
      toast.success('复制成功', {
        description: '图片HTML已复制，可直接粘贴到编辑器',
      });
    } catch (error) {
      // 降级：复制URL
      try {
        await navigator.clipboard.writeText(image.url);
        toast.success('已复制图片链接');
      } catch (e) {
        toast.error('复制失败');
      }
    }
  };

  const handleDownload = async (image: ImageAsset) => {
    setDownloadingId(image.id);
    try {
      const res = await fetch(image.url, { mode: 'cors' });
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
    } catch (error) {
      // 降级：<a download> 标签
      const a = document.createElement('a');
      a.href = image.url;
      a.download = `${image.source}-${image.id}.jpg`;
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">图片素材库</h1>
        <p className="text-muted-foreground">
          免费无版权图片，点击预览，一键复制到文章
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索图片，例如：风景、科技、美食..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Select value={orientation} onValueChange={setOrientation}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="方向" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="landscape">横版</SelectItem>
            <SelectItem value="portrait">竖版</SelectItem>
            <SelectItem value="squarish">方形</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => handleSearch()} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          搜索
        </Button>
      </div>

      {/* Preset Keywords */}
      <div className="flex flex-wrap gap-2">
        {presetKeywords.map((keyword) => (
          <Button
            key={keyword}
            variant="outline"
            size="sm"
            onClick={() => handleSearch(keyword)}
            className={searchQuery === keyword ? 'bg-primary text-primary-foreground' : ''}
          >
            {keyword}
          </Button>
        ))}
      </div>

      {/* Image Sources */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">图片来源：</span>
        <Badge className={`${sourceColors.unsplash} text-white`}>Unsplash</Badge>
        <Badge className={`${sourceColors.pexels} text-white`}>Pexels</Badge>
        <Badge className={`${sourceColors.pixabay} text-white`}>Pixabay</Badge>
      </div>

      {/* Images Grid */}
      {loading && images.length === 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-3">
                <Skeleton className="h-3 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : images.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {images.map((image) => (
              <Card
                key={image.id}
                className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02]"
                onClick={() => setPreviewImage(image)}
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={image.thumbUrl}
                    alt={image.alt}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7lm77niYc8L3RleHQ+PC9zdmc+';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge className={`${sourceColors[image.source] || 'bg-gray-500'} text-white text-xs`}>
                      {sourceNames[image.source] || image.source}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
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
                        className="h-8 w-8"
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
                <CardContent className="p-3">
                  <p className="text-sm text-muted-foreground truncate">
                    {image.author}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={handleLoadMore}
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 加载中...</>
              ) : '加载更多'}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Image className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">搜索免费图片</h3>
          <p className="text-muted-foreground mb-4">
            输入关键词搜索来自 Unsplash、Pexels、Pixabay 的免费图片
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {presetKeywords.slice(0, 8).map((keyword) => (
              <Button
                key={keyword}
                variant="outline"
                size="sm"
                onClick={() => handleSearch(keyword)}
              >
                {keyword}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Dialog - 直接在平台内预览 */}
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
                  <p className="font-medium">{previewImage.author}</p>
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
                    复制到编辑器
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
