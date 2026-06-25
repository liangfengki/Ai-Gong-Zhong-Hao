// 一键排版样式系统
// 内置多种热门公众号排版风格

export type TemplateCategory = '简约' | '文艺' | '商务' | '国潮' | '创意' | '科技';

export interface StyleTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: TemplateCategory;
  preview: string; // 预览色块
  styles: {
    // 全局样式
    body: React.CSSProperties;
    // 标题样式
    h1: React.CSSProperties;
    h2: React.CSSProperties;
    h3: React.CSSProperties;
    // 段落样式
    p: React.CSSProperties;
    // 引用样式
    blockquote: React.CSSProperties;
    // 列表样式
    list: React.CSSProperties;
    // 分割线样式
    hr: React.CSSProperties;
    // 链接样式
    a: React.CSSProperties;
    // 图片样式
    img: React.CSSProperties;
    // 强调样式
    strong: React.CSSProperties;
    // 高亮样式
    mark: React.CSSProperties;
  };
}

export const styleTemplates: StyleTemplate[] = [
  // ──────────────────────────────────────
  // 1. 简约商务 — 干净克制的企业风格
  // ──────────────────────────────────────
  {
    id: 'business',
    name: '简约商务',
    description: '干净克制，适合企业与商业号',
    icon: '',
    category: '商务',
    preview: '#1e3a5f',
    styles: {
      body: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        lineHeight: '1.85',
        color: '#2c2c2c',
        padding: '0',
        margin: '0',
      },
      h1: {
        fontSize: '22px',
        fontWeight: '700',
        color: '#1e3a5f',
        textAlign: 'center',
        margin: '32px 0 18px',
        padding: '14px 0 12px',
        borderBottom: '3px solid #1e3a5f',
        letterSpacing: '1px',
      },
      h2: {
        fontSize: '17px',
        fontWeight: '700',
        color: '#1e3a5f',
        margin: '28px 0 14px',
        paddingLeft: '14px',
        borderLeft: '4px solid #1e3a5f',
        lineHeight: '1.4',
      },
      h3: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#3d5a80',
        margin: '22px 0 10px',
      },
      p: {
        margin: '14px 0',
        textAlign: 'justify',
      },
      blockquote: {
        margin: '20px 0',
        padding: '16px 20px',
        backgroundColor: '#f4f7fb',
        borderLeft: '4px solid #1e3a5f',
        borderRadius: '0 6px 6px 0',
        color: '#5a6d82',
        fontSize: '14px',
        lineHeight: '1.75',
      },
      list: {
        margin: '14px 0',
        paddingLeft: '24px',
      },
      hr: {
        border: 'none',
        height: '1px',
        background: 'linear-gradient(to right, transparent, #b0c4de, transparent)',
        margin: '28px 0',
      },
      a: {
        color: '#1e3a5f',
        textDecoration: 'none',
        borderBottom: '1px solid rgba(30, 58, 95, 0.3)',
      },
      img: {
        maxWidth: '100%',
        borderRadius: '6px',
        margin: '18px 0',
      },
      strong: {
        color: '#1e3a5f',
        fontWeight: '700',
      },
      mark: {
        backgroundColor: '#e8eff8',
        padding: '2px 6px',
        borderRadius: '3px',
        color: '#1e3a5f',
      },
    },
  },

  // ──────────────────────────────────────
  // 2. 文艺清新 — 自然柔和的生活风格
  // ──────────────────────────────────────
  {
    id: 'fresh',
    name: '文艺清新',
    description: '自然柔和，适合生活与美学号',
    icon: '',
    category: '文艺',
    preview: '#5b8c5a',
    styles: {
      body: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        lineHeight: '2.0',
        color: '#4a4a4a',
        padding: '0',
        margin: '0',
      },
      h1: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#5b8c5a',
        textAlign: 'center',
        margin: '32px 0 18px',
        padding: '12px 0',
        letterSpacing: '3px',
      },
      h2: {
        fontSize: '17px',
        fontWeight: '600',
        color: '#5b8c5a',
        margin: '28px 0 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      },
      h3: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#6b9a6a',
        margin: '22px 0 10px',
      },
      p: {
        margin: '16px 0',
        textIndent: '2em',
        textAlign: 'justify',
      },
      blockquote: {
        margin: '22px 0',
        padding: '18px 22px',
        backgroundColor: '#f2f8f1',
        borderLeft: '4px solid #5b8c5a',
        borderRadius: '0 10px 10px 0',
        color: '#5f7d5e',
        fontSize: '14px',
        fontStyle: 'italic',
        lineHeight: '1.8',
      },
      list: {
        margin: '14px 0',
        paddingLeft: '24px',
      },
      hr: {
        border: 'none',
        height: '1px',
        background: 'linear-gradient(to right, transparent, #a3c9a2, transparent)',
        margin: '32px 0',
      },
      a: {
        color: '#5b8c5a',
        textDecoration: 'none',
        borderBottom: '1px dashed rgba(91, 140, 90, 0.4)',
      },
      img: {
        maxWidth: '100%',
        borderRadius: '12px',
        margin: '20px 0',
        boxShadow: '0 4px 16px rgba(91, 140, 90, 0.12)',
      },
      strong: {
        color: '#5b8c5a',
        fontWeight: '600',
      },
      mark: {
        backgroundColor: '#e8f5e8',
        padding: '2px 7px',
        borderRadius: '4px',
        color: '#3d6b3d',
      },
    },
  },

  // ──────────────────────────────────────
  // 3. 活力撞色 — 明亮大胆的营销风格
  // ──────────────────────────────────────
  {
    id: 'vibrant',
    name: '活力撞色',
    description: '明亮大胆，适合营销与活动号',
    icon: '',
    category: '创意',
    preview: '#e63946',
    styles: {
      body: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        lineHeight: '1.8',
        color: '#2b2b2b',
        padding: '0',
        margin: '0',
      },
      h1: {
        fontSize: '21px',
        fontWeight: '800',
        color: '#ffffff',
        textAlign: 'center',
        margin: '32px 0 20px',
        padding: '16px 28px',
        background: 'linear-gradient(135deg, #e63946 0%, #f77f00 100%)',
        borderRadius: '10px',
        letterSpacing: '1px',
      },
      h2: {
        fontSize: '17px',
        fontWeight: '700',
        color: '#e63946',
        margin: '26px 0 14px',
        padding: '12px 16px',
        backgroundColor: '#fef2f2',
        borderRadius: '8px',
        borderLeft: '4px solid #e63946',
      },
      h3: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#c1121f',
        margin: '20px 0 10px',
      },
      p: {
        margin: '14px 0',
        textAlign: 'justify',
      },
      blockquote: {
        margin: '20px 0',
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #fef2f2, #fff7ed)',
        borderLeft: '4px solid #e63946',
        borderRadius: '0 8px 8px 0',
        color: '#6b5b5b',
        fontSize: '14px',
        lineHeight: '1.75',
      },
      list: {
        margin: '14px 0',
        paddingLeft: '24px',
      },
      hr: {
        border: 'none',
        height: '3px',
        background: 'linear-gradient(to right, #e63946, #f77f00, #fcbf49)',
        margin: '28px 0',
        borderRadius: '2px',
      },
      a: {
        color: '#e63946',
        textDecoration: 'none',
        fontWeight: '600',
      },
      img: {
        maxWidth: '100%',
        borderRadius: '10px',
        margin: '16px 0',
        boxShadow: '0 4px 14px rgba(230, 57, 70, 0.15)',
      },
      strong: {
        color: '#e63946',
        fontWeight: '700',
      },
      mark: {
        backgroundColor: '#fff3cd',
        padding: '2px 7px',
        borderRadius: '4px',
        fontWeight: '600',
        color: '#856404',
      },
    },
  },

  // ──────────────────────────────────────
  // 4. 杂志排版 — 经典报刊编辑风格
  // ──────────────────────────────────────
  {
    id: 'magazine',
    name: '杂志排版',
    description: '经典报刊感，适合资讯与深度报道',
    icon: '',
    category: '简约',
    preview: '#1a1a2e',
    styles: {
      body: {
        fontFamily: 'Georgia, "Noto Serif SC", "Source Han Serif CN", "PingFang SC", "Microsoft YaHei", serif',
        fontSize: '15px',
        lineHeight: '1.95',
        color: '#1a1a2e',
        padding: '0',
        margin: '0',
      },
      h1: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1a1a2e',
        textAlign: 'center',
        margin: '32px 0 12px',
        letterSpacing: '3px',
      },
      h2: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#1a1a2e',
        margin: '32px 0 14px',
        paddingBottom: '10px',
        borderBottom: '2px solid #1a1a2e',
      },
      h3: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#3a3a5c',
        margin: '24px 0 10px',
        fontStyle: 'italic',
      },
      p: {
        margin: '14px 0',
        textAlign: 'justify',
        textIndent: '2em',
      },
      blockquote: {
        margin: '24px 0',
        padding: '20px 24px',
        backgroundColor: '#f6f6f8',
        borderLeft: '4px solid #1a1a2e',
        color: '#4a4a5e',
        fontSize: '14px',
        fontStyle: 'italic',
        lineHeight: '1.8',
      },
      list: {
        margin: '14px 0',
        paddingLeft: '28px',
      },
      hr: {
        border: 'none',
        height: '1px',
        backgroundColor: '#1a1a2e',
        margin: '32px auto',
        width: '50%',
        marginLeft: 'auto',
        marginRight: 'auto',
      },
      a: {
        color: '#1a1a2e',
        textDecoration: 'underline',
        textDecorationColor: 'rgba(26, 26, 46, 0.3)',
        textUnderlineOffset: '3px',
      },
      img: {
        maxWidth: '100%',
        margin: '22px 0',
      },
      strong: {
        color: '#1a1a2e',
        fontWeight: '700',
      },
      mark: {
        backgroundColor: '#ececf0',
        padding: '2px 5px',
        color: '#1a1a2e',
      },
    },
  },

  // ──────────────────────────────────────
  // 5. 卡片式排版 — 现代悬浮卡片风格
  // ──────────────────────────────────────
  {
    id: 'card',
    name: '卡片式排版',
    description: '悬浮卡片，适合产品介绍与清单',
    icon: '',
    category: '创意',
    preview: '#5c6bc0',
    styles: {
      body: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        lineHeight: '1.8',
        color: '#333333',
        padding: '0',
        margin: '0',
        backgroundColor: '#f0f2f5',
      },
      h1: {
        fontSize: '22px',
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        margin: '24px 0 18px',
        padding: '18px 24px',
        background: 'linear-gradient(135deg, #5c6bc0, #7c4dff)',
        borderRadius: '14px',
        boxShadow: '0 6px 20px rgba(92, 107, 192, 0.25)',
        letterSpacing: '1px',
      },
      h2: {
        fontSize: '17px',
        fontWeight: '700',
        color: '#5c6bc0',
        margin: '22px 0 12px',
        padding: '14px 18px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      },
      h3: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#5c6bc0',
        margin: '18px 0 8px',
      },
      p: {
        margin: '12px 0',
        padding: '16px 20px',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        textAlign: 'justify',
      },
      blockquote: {
        margin: '18px 0',
        padding: '18px 20px',
        backgroundColor: '#ffffff',
        borderLeft: '4px solid #7c4dff',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
        color: '#5a5a7a',
        fontSize: '14px',
        lineHeight: '1.75',
      },
      list: {
        margin: '12px 0',
        paddingLeft: '24px',
      },
      hr: {
        border: 'none',
        height: '1px',
        background: 'linear-gradient(to right, transparent, #c5cae9, transparent)',
        margin: '24px 0',
      },
      a: {
        color: '#5c6bc0',
        textDecoration: 'none',
        borderBottom: '1px solid rgba(92, 107, 192, 0.3)',
      },
      img: {
        maxWidth: '100%',
        borderRadius: '12px',
        margin: '14px 0',
        boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
      },
      strong: {
        color: '#5c6bc0',
        fontWeight: '700',
      },
      mark: {
        backgroundColor: '#ede7f6',
        padding: '2px 7px',
        borderRadius: '4px',
        color: '#5c6bc0',
      },
    },
  },

  // ──────────────────────────────────────
  // 6. 极简留白 — 大量留白的深度阅读
  // ──────────────────────────────────────
  {
    id: 'minimal',
    name: '极简留白',
    description: '克制留白，适合深度长文与随笔',
    icon: '',
    category: '简约',
    preview: '#2c2c2c',
    styles: {
      body: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        fontSize: '16px',
        lineHeight: '2.2',
        color: '#2c2c2c',
        padding: '0',
        margin: '0',
      },
      h1: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#2c2c2c',
        textAlign: 'center',
        margin: '44px 0 28px',
        letterSpacing: '5px',
      },
      h2: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#2c2c2c',
        margin: '44px 0 18px',
        textAlign: 'center',
        letterSpacing: '2px',
      },
      h3: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#555',
        margin: '32px 0 14px',
      },
      p: {
        margin: '18px 0',
        textAlign: 'justify',
      },
      blockquote: {
        margin: '32px 20px',
        padding: '22px 0',
        borderLeft: 'none',
        color: '#999',
        fontSize: '15px',
        fontStyle: 'italic',
        textAlign: 'center',
        letterSpacing: '1px',
      },
      list: {
        margin: '18px 0',
        paddingLeft: '24px',
      },
      hr: {
        border: 'none',
        height: '1px',
        backgroundColor: '#ddd',
        margin: '44px 22%',
      },
      a: {
        color: '#2c2c2c',
        textDecoration: 'underline',
        textDecorationColor: 'rgba(44, 44, 44, 0.25)',
        textUnderlineOffset: '4px',
      },
      img: {
        maxWidth: '100%',
        margin: '32px 0',
      },
      strong: {
        color: '#2c2c2c',
        fontWeight: '700',
      },
      mark: {
        backgroundColor: '#f5f5f5',
        padding: '2px 6px',
        color: '#666',
      },
    },
  },

  // ──────────────────────────────────────
  // 7. 科技极客 — 深色代码风格
  // ──────────────────────────────────────
  {
    id: 'tech',
    name: '科技极客',
    description: '深色终端风，适合技术与编程号',
    icon: '',
    category: '科技',
    preview: '#0d1117',
    styles: {
      body: {
        fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", "PingFang SC", "Microsoft YaHei", monospace',
        fontSize: '14px',
        lineHeight: '1.85',
        color: '#c9d1d9',
        padding: '0',
        margin: '0',
        backgroundColor: '#0d1117',
      },
      h1: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#58a6ff',
        textAlign: 'center',
        margin: '32px 0 18px',
        padding: '16px 18px',
        backgroundColor: '#161b22',
        borderRadius: '10px',
        border: '1px solid #30363d',
        letterSpacing: '1px',
      },
      h2: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#58a6ff',
        margin: '26px 0 14px',
        padding: '11px 16px',
        backgroundColor: '#161b22',
        borderRadius: '8px',
        borderLeft: '4px solid #58a6ff',
      },
      h3: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#8b949e',
        margin: '22px 0 10px',
      },
      p: {
        margin: '14px 0',
        textAlign: 'justify',
      },
      blockquote: {
        margin: '20px 0',
        padding: '16px 20px',
        backgroundColor: '#161b22',
        borderLeft: '4px solid #3fb950',
        borderRadius: '0 8px 8px 0',
        color: '#8b949e',
        fontSize: '13px',
        lineHeight: '1.75',
      },
      list: {
        margin: '14px 0',
        paddingLeft: '24px',
      },
      hr: {
        border: 'none',
        height: '1px',
        background: 'linear-gradient(to right, transparent, #30363d, transparent)',
        margin: '28px 0',
      },
      a: {
        color: '#58a6ff',
        textDecoration: 'none',
        borderBottom: '1px dotted rgba(88, 166, 255, 0.4)',
      },
      img: {
        maxWidth: '100%',
        borderRadius: '8px',
        margin: '16px 0',
        border: '1px solid #30363d',
      },
      strong: {
        color: '#58a6ff',
        fontWeight: '700',
      },
      mark: {
        backgroundColor: '#1c2333',
        padding: '2px 7px',
        borderRadius: '4px',
        color: '#f0883e',
      },
    },
  },

  // ──────────────────────────────────────
  // 8. 暖色调 — 温馨治愈的情感风格
  // ──────────────────────────────────────
  {
    id: 'warm',
    name: '暖色调',
    description: '温馨治愈，适合情感与生活感悟号',
    icon: '',
    category: '文艺',
    preview: '#c05621',
    styles: {
      body: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        lineHeight: '1.9',
        color: '#483c32',
        padding: '0',
        margin: '0',
      },
      h1: {
        fontSize: '21px',
        fontWeight: '700',
        color: '#c05621',
        textAlign: 'center',
        margin: '30px 0 18px',
        padding: '14px 0 10px',
        borderBottom: '2px solid #edcdaf',
        letterSpacing: '1px',
      },
      h2: {
        fontSize: '17px',
        fontWeight: '600',
        color: '#c05621',
        margin: '26px 0 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      },
      h3: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#a0431a',
        margin: '22px 0 10px',
      },
      p: {
        margin: '16px 0',
        textAlign: 'justify',
      },
      blockquote: {
        margin: '20px 0',
        padding: '18px 22px',
        backgroundColor: '#fdf6f0',
        borderLeft: '4px solid #c05621',
        borderRadius: '0 10px 10px 0',
        color: '#7a6455',
        fontSize: '14px',
        lineHeight: '1.8',
      },
      list: {
        margin: '14px 0',
        paddingLeft: '24px',
      },
      hr: {
        border: 'none',
        height: '2px',
        background: 'linear-gradient(to right, transparent, #edcdaf, transparent)',
        margin: '28px 0',
      },
      a: {
        color: '#c05621',
        textDecoration: 'none',
        borderBottom: '1px solid rgba(192, 86, 33, 0.25)',
      },
      img: {
        maxWidth: '100%',
        borderRadius: '10px',
        margin: '18px 0',
        boxShadow: '0 4px 14px rgba(192, 86, 33, 0.1)',
      },
      strong: {
        color: '#c05621',
        fontWeight: '700',
      },
      mark: {
        backgroundColor: '#fef0e4',
        padding: '2px 7px',
        borderRadius: '4px',
        color: '#8a4f2a',
      },
    },
  },

  // ──────────────────────────────────────
  // 9. 国潮风 — 中式传统与现代融合
  // ──────────────────────────────────────
  {
    id: 'guochao',
    name: '国潮风',
    description: '中式美学，适合文化与国风号',
    icon: '',
    category: '国潮',
    preview: '#8b1a1a',
    styles: {
      body: {
        fontFamily: '"Noto Serif SC", "Source Han Serif CN", "STSong", "SimSun", Georgia, serif',
        fontSize: '15px',
        lineHeight: '1.9',
        color: '#3a2a1a',
        padding: '0',
        margin: '0',
      },
      h1: {
        fontSize: '22px',
        fontWeight: '700',
        color: '#8b1a1a',
        textAlign: 'center',
        margin: '32px 0 16px',
        padding: '16px 24px',
        letterSpacing: '4px',
        borderBottom: '2px double #8b1a1a',
      },
      h2: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#8b1a1a',
        margin: '28px 0 14px',
        padding: '10px 16px',
        borderLeft: '4px double #8b1a1a',
        backgroundColor: '#fdf5f0',
      },
      h3: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#a03030',
        margin: '22px 0 10px',
        letterSpacing: '1px',
      },
      p: {
        margin: '14px 0',
        textAlign: 'justify',
        textIndent: '2em',
      },
      blockquote: {
        margin: '22px 0',
        padding: '18px 22px',
        backgroundColor: '#fdf8f0',
        borderLeft: '4px solid #c8a050',
        borderRadius: '0 6px 6px 0',
        color: '#6b5540',
        fontSize: '14px',
        fontStyle: 'italic',
        lineHeight: '1.8',
      },
      list: {
        margin: '14px 0',
        paddingLeft: '24px',
      },
      hr: {
        border: 'none',
        height: '2px',
        background: 'linear-gradient(to right, transparent, #8b1a1a, #c8a050, #8b1a1a, transparent)',
        margin: '30px 0',
      },
      a: {
        color: '#8b1a1a',
        textDecoration: 'none',
        borderBottom: '1px solid rgba(139, 26, 26, 0.3)',
      },
      img: {
        maxWidth: '100%',
        borderRadius: '4px',
        margin: '18px 0',
        border: '2px solid #c8a050',
        padding: '3px',
      },
      strong: {
        color: '#8b1a1a',
        fontWeight: '700',
      },
      mark: {
        backgroundColor: '#fef5e7',
        padding: '2px 7px',
        borderRadius: '2px',
        color: '#8b1a1a',
        fontWeight: '600',
      },
    },
  },

  // ──────────────────────────────────────
  // 10. Ins风 — 潮流轻奢社交媒体风
  // ──────────────────────────────────────
  {
    id: 'ins',
    name: 'Ins风',
    description: '潮流轻奢，适合时尚与生活分享',
    icon: '',
    category: '文艺',
    preview: '#e8a0bf',
    styles: {
      body: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        lineHeight: '1.9',
        color: '#3d3d3d',
        padding: '0',
        margin: '0',
      },
      h1: {
        fontSize: '21px',
        fontWeight: '700',
        color: '#c26e8a',
        textAlign: 'center',
        margin: '30px 0 18px',
        padding: '14px 0',
        letterSpacing: '3px',
      },
      h2: {
        fontSize: '17px',
        fontWeight: '600',
        color: '#c26e8a',
        margin: '26px 0 14px',
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #fef6f8, #f5eef8)',
        borderRadius: '10px',
        textAlign: 'center',
      },
      h3: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#b0607e',
        margin: '20px 0 10px',
      },
      p: {
        margin: '16px 0',
        textAlign: 'justify',
      },
      blockquote: {
        margin: '20px 0',
        padding: '20px 22px',
        background: 'linear-gradient(135deg, #fef8fa, #f8f0f8)',
        borderLeft: '4px solid #e8a0bf',
        borderRadius: '0 12px 12px 0',
        color: '#7a6070',
        fontSize: '14px',
        lineHeight: '1.8',
      },
      list: {
        margin: '14px 0',
        paddingLeft: '24px',
      },
      hr: {
        border: 'none',
        height: '2px',
        background: 'linear-gradient(to right, #e8a0bf, #b8a0d0, #a0c4e8)',
        margin: '28px 0',
        borderRadius: '1px',
      },
      a: {
        color: '#c26e8a',
        textDecoration: 'none',
        borderBottom: '1px solid rgba(194, 110, 138, 0.25)',
      },
      img: {
        maxWidth: '100%',
        borderRadius: '14px',
        margin: '18px 0',
        boxShadow: '0 4px 16px rgba(200, 160, 191, 0.2)',
      },
      strong: {
        color: '#c26e8a',
        fontWeight: '600',
      },
      mark: {
        background: 'linear-gradient(to bottom, transparent 40%, #fce4ec 40%)',
        padding: '2px 4px',
        borderRadius: '2px',
        color: '#b0607e',
      },
    },
  },

  // ──────────────────────────────────────
  // 11. 学术风 — 严谨规范的学术排版
  // ──────────────────────────────────────
  {
    id: 'academic',
    name: '学术风',
    description: '严谨规范，适合研究与教育号',
    icon: '',
    category: '商务',
    preview: '#2c3e6b',
    styles: {
      body: {
        fontFamily: 'Georgia, "Noto Serif SC", "Source Han Serif CN", "STSong", "SimSun", serif',
        fontSize: '15px',
        lineHeight: '1.9',
        color: '#1a1a1a',
        padding: '0',
        margin: '0',
      },
      h1: {
        fontSize: '22px',
        fontWeight: '700',
        color: '#2c3e6b',
        textAlign: 'center',
        margin: '32px 0 12px',
        padding: '12px 0',
        letterSpacing: '2px',
      },
      h2: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#2c3e6b',
        margin: '28px 0 12px',
        paddingBottom: '8px',
        borderBottom: '1px solid #2c3e6b',
      },
      h3: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#3a5080',
        margin: '22px 0 10px',
        fontStyle: 'italic',
      },
      p: {
        margin: '14px 0',
        textAlign: 'justify',
        textIndent: '2em',
      },
      blockquote: {
        margin: '22px 0',
        padding: '18px 22px',
        backgroundColor: '#f4f6fa',
        borderLeft: '4px solid #2c3e6b',
        borderRadius: '0 4px 4px 0',
        color: '#4a4a5e',
        fontSize: '14px',
        lineHeight: '1.8',
      },
      list: {
        margin: '14px 0',
        paddingLeft: '28px',
      },
      hr: {
        border: 'none',
        height: '1px',
        backgroundColor: '#c0c8d8',
        margin: '28px 15%',
      },
      a: {
        color: '#2c3e6b',
        textDecoration: 'underline',
        textDecorationColor: 'rgba(44, 62, 107, 0.3)',
        textUnderlineOffset: '3px',
      },
      img: {
        maxWidth: '100%',
        margin: '20px 0',
        border: '1px solid #e0e4ea',
      },
      strong: {
        color: '#2c3e6b',
        fontWeight: '700',
      },
      mark: {
        backgroundColor: '#e8ecf4',
        padding: '2px 6px',
        borderRadius: '2px',
        color: '#2c3e6b',
      },
    },
  },
];

// 获取样式模板
export function getStyleTemplate(id: string): StyleTemplate | undefined {
  return styleTemplates.find(t => t.id === id);
}

// 将样式对象转换为CSS字符串
export function stylesToCSS(styles: StyleTemplate['styles']): string {
  const cssMap: Record<string, React.CSSProperties> = styles;
  let css = '';
  
  for (const [selector, style] of Object.entries(cssMap)) {
    const cssProperties = Object.entries(style)
      .map(([key, value]) => {
        // 将驼峰命名转换为连字符命名
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `  ${cssKey}: ${value};`;
      })
      .join('\n');
    
    css += `.${selector} {\n${cssProperties}\n}\n\n`;
  }
  
  return css;
}
