import { Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SafeHtml } from '@/components/ui/safe-html';

interface PhonePreviewProps {
  title: string;
  content: string;
}

export function PhonePreview({ title, content }: PhonePreviewProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Smartphone className="mr-1 h-4 w-4" />
          手机预览
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[440px] p-8 bg-gradient-to-b from-zinc-900 to-zinc-950 max-sm:max-w-[calc(100vw-2rem)] max-sm:p-4">
        <DialogHeader>
          <DialogTitle className="text-white">手机预览</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          {/* iPhone Frame - 移动端缩放以适配屏幕 */}
          <div className="relative w-[375px] h-[740px] rounded-[52px] bg-zinc-950 p-[10px] shadow-[0_0_0_2px_#3a3a3c,0_0_0_4px_#1c1c1e,0_20px_60px_rgba(0,0,0,0.5)] max-sm:scale-[0.8] max-sm:origin-top">
            {/* Side buttons */}
            <div className="absolute -left-[3px] top-[120px] w-[3px] h-[28px] bg-zinc-700 rounded-l-sm" />
            <div className="absolute -left-[3px] top-[170px] w-[3px] h-[50px] bg-zinc-700 rounded-l-sm" />
            <div className="absolute -left-[3px] top-[230px] w-[3px] h-[50px] bg-zinc-700 rounded-l-sm" />
            <div className="absolute -right-[3px] top-[180px] w-[3px] h-[70px] bg-zinc-700 rounded-r-sm" />

            {/* Screen */}
            <div className="w-full h-full rounded-[44px] bg-white overflow-hidden flex flex-col relative">
              {/* Dynamic Island */}
              <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[126px] h-[36px] bg-black rounded-full z-20" />

              {/* Status Bar */}
              <div className="flex items-center justify-between px-8 pt-[14px] pb-2 text-[13px] text-zinc-800 bg-white relative z-10">
                <span className="font-semibold tracking-tight">9:41</span>
                <div className="flex items-center gap-[5px]">
                  {/* Signal bars */}
                  <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
                    <rect x="0" y="8" width="3" height="4" rx="0.5" fill="#1c1c1e"/>
                    <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.5" fill="#1c1c1e"/>
                    <rect x="9" y="3" width="3" height="9" rx="0.5" fill="#1c1c1e"/>
                    <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="#1c1c1e"/>
                  </svg>
                  {/* WiFi */}
                  <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                    <path d="M8 11.5a1.2 1.2 0 110-2.4 1.2 1.2 0 010 2.4z" fill="#1c1c1e"/>
                    <path d="M5.17 8.33a4 4 0 015.66 0" stroke="#1c1c1e" strokeWidth="1.3" strokeLinecap="round"/>
                    <path d="M3 6.17a6.5 6.5 0 0110 0" stroke="#1c1c1e" strokeWidth="1.3" strokeLinecap="round"/>
                    <path d="M.83 4a9 9 0 0114.34 0" stroke="#1c1c1e" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  {/* Battery */}
                  <div className="flex items-center gap-[2px]">
                    <div className="w-[25px] h-[12px] rounded-[3px] border border-zinc-800 relative overflow-hidden">
                      <div className="absolute inset-[1.5px] bg-green-500 rounded-[1.5px]" style={{ width: 'calc(100% - 3px)' }}/>
                    </div>
                    <div className="w-[1.5px] h-[5px] bg-zinc-800 rounded-r-sm" />
                  </div>
                </div>
              </div>

              {/* WeChat Article Header */}
              <div className="px-4 pt-8 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    公
                  </div>
                  <div>
                    <div className="text-[15px] font-medium text-gray-900 leading-tight">公众号名称</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">原创 · 今天</div>
                  </div>
                </div>
                <h1 className="text-[20px] font-bold leading-[1.4] text-gray-900 tracking-tight">
                  {title || '文章标题'}
                </h1>
              </div>

              {/* Article Content */}
              <div className="flex-1 overflow-y-auto px-4 py-4 overscroll-contain">
                <SafeHtml
                  html={content || '<p style="color:#bbb;text-align:center;padding:40px 0;">暂无内容</p>'}
                  className="text-[15px] leading-[1.85] text-[#333] selection:bg-blue-100"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif',
                    wordBreak: 'break-word',
                  }}
                />
              </div>

              {/* Bottom Toolbar */}
              <div className="border-t border-gray-100 bg-white">
                <div className="flex items-center justify-around px-4 py-[10px]">
                  <button className="flex items-center gap-1 text-[12px] text-gray-500 active:text-gray-800">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    赞
                  </button>
                  <button className="flex items-center gap-1 text-[12px] text-gray-500 active:text-gray-800">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    收藏
                  </button>
                  <button className="flex items-center gap-1 text-[12px] text-gray-500 active:text-gray-800">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    分享
                  </button>
                  <button className="flex items-center gap-1 text-[12px] text-gray-500 active:text-gray-800">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    在看
                  </button>
                </div>
                {/* Home indicator */}
                <div className="flex justify-center pb-2">
                  <div className="w-[134px] h-[5px] bg-zinc-800 rounded-full opacity-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
