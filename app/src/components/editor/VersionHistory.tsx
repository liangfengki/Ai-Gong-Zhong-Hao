import { History, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/useAppStore';
import { format } from 'date-fns';
import type { ArticleVersion } from '@/types';

interface VersionHistoryProps {
  articleId: string | undefined;
  onRestore: (version: ArticleVersion) => void;
}

export function VersionHistory({ articleId, onRestore }: VersionHistoryProps) {
  const { articleVersions, deleteArticleVersion } = useAppStore();

  const versions = articleVersions
    .filter((v) => v.articleId === articleId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MM-dd HH:mm:ss');
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <History className="mr-1 h-4 w-4" />
          版本历史
          {versions.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {versions.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>版本历史</DialogTitle>
          <DialogDescription>
            查看当前文章的历史版本，可恢复或删除单个版本。
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          {versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">暂无历史版本</p>
              <p className="text-xs">保存文章时会自动创建版本</p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{version.title || '无标题'}</span>
                      {index === 0 && (
                        <Badge variant="default" className="text-xs">最新</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(version.createdAt)} · {version.wordCount} 字
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {version.content.replace(/<[^>]*>/g, '').slice(0, 100)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label="恢复此版本"
                      title="恢复此版本"
                      onClick={() => onRestore(version)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      aria-label="删除此版本"
                      title="删除此版本"
                      onClick={() => deleteArticleVersion(version.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
