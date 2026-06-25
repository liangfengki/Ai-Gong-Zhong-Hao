import { useState, useMemo } from 'react';
import { Sliders, Eye, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SafeHtml } from '@/components/ui/safe-html';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { styleTemplates, type StyleTemplate } from '@/lib/styleTemplates';
import { toast } from 'sonner';

interface TemplateEditorProps {
  onSave: (template: StyleTemplate) => void;
}

const fontOptions = [
  { label: '系统默认', value: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif' },
  { label: '宋体', value: 'SimSun, "Songti SC", serif' },
  { label: '黑体', value: 'SimHei, "Heiti SC", sans-serif' },
  { label: '楷体', value: 'KaiTi, "Kaiti SC", serif' },
  { label: '衬线体', value: 'Georgia, "Times New Roman", "PingFang SC", serif' },
  { label: '等宽体', value: '"JetBrains Mono", "Fira Code", monospace' },
];

const presetColors = [
  '#2b5797', '#7fbb6f', '#ff6b6b', '#e17055', '#6c5ce7',
  '#00b894', '#fdcb6e', '#e84393', '#0984e3', '#2d3436',
  '#636e72', '#d63031', '#00cec9', '#a29bfe', '#fab1a0',
];

export function TemplateEditor({ onSave }: TemplateEditorProps) {
  const [open, setOpen] = useState(false);
  const [baseTemplateId, setBaseTemplateId] = useState('business');
  const [config, setConfig] = useState({
    fontFamily: 0,
    fontSize: 15,
    lineHeight: 18,
    h2Color: '#2b5797',
    pColor: '#333333',
    accentColor: '#2b5797',
    blockquoteBg: '#f8f9fa',
    borderRadius: 4,
  });

  const baseTemplate = styleTemplates.find(t => t.id === baseTemplateId) || styleTemplates[0];

  const previewHtml = useMemo(() => {
    const h2Style = `color:${config.h2Color};font-size:18px;font-weight:700;margin:20px 0 12px;padding-left:12px;border-left:4px solid ${config.accentColor};`;
    const pStyle = `color:${config.pColor};font-size:${config.fontSize}px;line-height:${config.lineHeight / 10};margin:12px 0;text-align:justify;`;
    const bqStyle = `margin:16px 0;padding:14px 18px;background:${config.blockquoteBg};border-left:4px solid ${config.accentColor};border-radius:0 ${config.borderRadius}px ${config.borderRadius}px 0;color:#666;font-size:14px;`;
    const hrStyle = `border:none;height:1px;background:${config.accentColor}40;margin:20px 0;`;

    return `<div style="font-family:${fontOptions[config.fontFamily].value}">
  <h2 style="${h2Style}">小标题样式预览</h2>
  <p style="${pStyle}">这是正文段落的预览效果。通过左侧的调节控件，你可以实时看到样式的变化。好的排版能让读者更舒适地阅读你的文章内容。</p>
  <blockquote style="${bqStyle}">这是一段引用文字的样式预览，用于展示引用块的视觉效果。</blockquote>
  <hr style="${hrStyle}" />
  <p style="${pStyle}"><strong style="color:${config.accentColor}">强调文字</strong>和普通文字的搭配效果。</p>
</div>`;
  }, [config, baseTemplateId]);

  const handleBaseChange = (id: string) => {
    setBaseTemplateId(id);
    const t = styleTemplates.find(s => s.id === id);
    if (t) {
      const h2c = (t.styles.h2.color as string) || '#333';
      const pc = (t.styles.p.color as string) || '#333';
      const ac = h2c;
      const bqb = (t.styles.blockquote.backgroundColor as string) || '#f8f9fa';
      const br = parseInt(String(t.styles.img.borderRadius || '4'), 10) || 4;
      const fs = parseInt(String(t.styles.body.fontSize || '15'), 10) || 15;
      const lh = Math.round(parseFloat(String(t.styles.body.lineHeight || '1.8')) * 10);
      const ffi = fontOptions.findIndex(f => f.value === t.styles.body.fontFamily);
      setConfig({
        fontFamily: ffi >= 0 ? ffi : 0,
        fontSize: fs,
        lineHeight: lh,
        h2Color: h2c,
        pColor: pc,
        accentColor: ac,
        blockquoteBg: bqb,
        borderRadius: br,
      });
    }
  };

  const handleReset = () => {
    handleBaseChange(baseTemplateId);
    toast.info('已重置为基础模板样式');
  };

  const handleSave = () => {
    const template: StyleTemplate = {
      id: `custom-${Date.now()}`,
      name: '自定义模板',
      description: '通过可视化编辑器创建',
      icon: '',
      category: '简约',
      preview: config.accentColor,
      styles: {
        body: {
          fontFamily: fontOptions[config.fontFamily].value,
          fontSize: `${config.fontSize}px`,
          lineHeight: `${config.lineHeight / 10}`,
          color: config.pColor,
          padding: '0',
          margin: '0',
        },
        h1: {
          ...baseTemplate.styles.h1,
          color: config.accentColor,
        },
        h2: {
          fontSize: '18px',
          fontWeight: '700',
          color: config.h2Color,
          margin: '25px 0 15px',
          paddingLeft: '12px',
          borderLeft: `4px solid ${config.accentColor}`,
        },
        h3: {
          ...baseTemplate.styles.h3,
          color: config.accentColor,
        },
        p: {
          margin: '15px 0',
          textAlign: 'justify',
        },
        blockquote: {
          margin: '20px 0',
          padding: '15px 20px',
          backgroundColor: config.blockquoteBg,
          borderLeft: `4px solid ${config.accentColor}`,
          borderRadius: `0 ${config.borderRadius}px ${config.borderRadius}px 0`,
          color: '#666',
          fontSize: '14px',
        },
        list: { margin: '15px 0', paddingLeft: '25px' },
        hr: {
          border: 'none',
          height: '1px',
          backgroundColor: `${config.accentColor}40`,
          margin: '25px 0',
        },
        a: { color: config.accentColor, textDecoration: 'none' },
        img: {
          maxWidth: '100%',
          borderRadius: `${config.borderRadius}px`,
          margin: '15px 0',
        },
        strong: { color: config.accentColor, fontWeight: '700' },
        mark: { backgroundColor: '#fff3cd', padding: '2px 5px', borderRadius: '2px' },
      },
    };

    onSave(template);
    toast.success('自定义模板已保存');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Sliders className="h-3.5 w-3.5" />
          可视化编辑
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" />
            模板可视化编辑器
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* 基础模板选择 */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">选择基础模板</Label>
            <div className="flex flex-wrap gap-1.5">
              {styleTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleBaseChange(t.id)}
                  className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                    baseTemplateId === t.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {t.icon} {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 左侧：调节控件 */}
            <div className="space-y-4">
              {/* 字体 */}
              <div className="space-y-1.5">
                <Label className="text-xs">正文字体</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {fontOptions.map((f, i) => (
                    <button
                      key={f.value}
                      onClick={() => setConfig(c => ({ ...c, fontFamily: i }))}
                      className={`px-2 py-1.5 rounded text-xs border text-left transition-colors ${
                        config.fontFamily === i
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-accent'
                      }`}
                      style={{ fontFamily: f.value }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 字号 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">正文字号</Label>
                  <span className="text-xs text-muted-foreground">{config.fontSize}px</span>
                </div>
                <Slider
                  value={[config.fontSize]}
                  onValueChange={([v]) => setConfig(c => ({ ...c, fontSize: v }))}
                  min={12}
                  max={18}
                  step={1}
                />
              </div>

              {/* 行高 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">行高</Label>
                  <span className="text-xs text-muted-foreground">{(config.lineHeight / 10).toFixed(1)}</span>
                </div>
                <Slider
                  value={[config.lineHeight]}
                  onValueChange={([v]) => setConfig(c => ({ ...c, lineHeight: v }))}
                  min={14}
                  max={26}
                  step={1}
                />
              </div>

              {/* 圆角 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">圆角大小</Label>
                  <span className="text-xs text-muted-foreground">{config.borderRadius}px</span>
                </div>
                <Slider
                  value={[config.borderRadius]}
                  onValueChange={([v]) => setConfig(c => ({ ...c, borderRadius: v }))}
                  min={0}
                  max={16}
                  step={1}
                />
              </div>

              {/* 主题色 */}
              <div className="space-y-1.5">
                <Label className="text-xs">主题色（标题/强调/引用边框）</Label>
                <div className="flex flex-wrap gap-1.5">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setConfig(c => ({ ...c, accentColor: color, h2Color: color }))}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        config.accentColor === color ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* 正文颜色 */}
              <div className="space-y-1.5">
                <Label className="text-xs">正文颜色</Label>
                <div className="flex flex-wrap gap-1.5">
                  {['#1a1a1a', '#333333', '#4a4a4a', '#555555', '#666666'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setConfig(c => ({ ...c, pColor: color }))}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        config.pColor === color ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* 引用背景 */}
              <div className="space-y-1.5">
                <Label className="text-xs">引用块背景色</Label>
                <div className="flex flex-wrap gap-1.5">
                  {['#f8f9fa', '#f0f7f0', '#fff5f5', '#f5f5f5', '#eef2ff', '#fef3c7'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setConfig(c => ({ ...c, blockquoteBg: color }))}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        config.blockquoteBg === color ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 右侧：实时预览 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  实时预览
                </Label>
              </div>
              <SafeHtml
                html={previewHtml}
                className="border rounded-lg p-4 min-h-[300px] bg-white overflow-y-auto"
              />
            </div>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-between border-t pt-3 mt-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            重置
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            保存模板
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
