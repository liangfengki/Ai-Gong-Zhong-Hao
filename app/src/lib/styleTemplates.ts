// 一键排版样式系统
// 内置多种热门公众号排版风格

export interface StyleTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
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
  {
    id: 'business',
    name: '简约商务',
    description: '干净专业，适合企业号',
    icon: '💼',
    preview: '#2b5797',
    styles: {
      body: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        lineHeight: '1.8',
        color: '#333333',
        padding: '0',
        margin: '0',
      },
      h1: {
        fontSize: '22px',
        fontWeight: '700',
        color: '#2b5797',
        textAlign: 'center',
        margin: '30px 0 20px',
        padding: '15px 0',
        borderBottom: '3px solid #2b5797',
      },
      h2: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#2b5797',
        margin: '25px 0 15px',
        paddingLeft: '15px',
        borderLeft: '4px solid #2b5797',
      },
      h3: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#333',
        margin: '20px 0 10px',
      },
      p: {
        margin: '15px 0',
        textAlign: 'justify',
      },
      blockquote: {
        margin: '20px 0',
        padding: '15px 20px',
        backgroundColor: '#f8f9fa',
        borderLeft: '4px solid #2b5797',
        color: '#666',
        fontSize: '14px',
      },
      list: {
        margin: '15px 0',
        paddingLeft: '25px',
      },
      hr: {
        border: 'none',
        height: '1px',
        backgroundColor: '#e0e0e0',
        margin: '25px 0',
      },
      a: {
        color: '#2b5797',
        textDecoration: 'none',
        borderBottom: '1px solid #2b5797',
      },
      img: {
        maxWidth: '100%',
        borderRadius: '4px',
        margin: '15px 0',
      },
      strong: {
        color: '#2b5797',
        fontWeight: '700',
      },
      mark: {
        backgroundColor: '#fff3cd',
        padding: '2px 5px',
        borderRadius: '2px',
      },
    },
  },
  {
    id: 'fresh',
    name: '文艺清新',
    description: '柔和配色，适合生活号',
    icon: '🌿',
    preview: '#7fbb6f',
    styles: {
      body: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        lineHeight: '2.0',
        color: '#555555',
        padding: '0',
        margin: '0',
      },
      h1: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#7fbb6f',
        textAlign: 'center',
        margin: '30px 0 20px',
        padding: '10px 0',
        letterSpacing: '2px',
      },
      h2: {
        fontSize: '17px',
        fontWeight: '600',
        color: '#7fbb6f',
        margin: '25px 0 15px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      },
      h3: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#666',
        margin: '20px 0 10px',
      },
      p: {
        margin: '18px 0',
        textIndent: '2em',
        textAlign: 'justify',
      },
      blockquote: {
        margin: '20px 0',
        padding: '20px',
        backgroundColor: '#f0f7f0',
        borderLeft: '4px solid #7fbb6f',
        borderRadius: '0 8px 8px 0',
        color: '#666',
        fontSize: '14px',
        fontStyle: 'italic',
      },
      list: {
        margin: '15px 0',
        paddingLeft: '25px',
      },
      hr: {
        border: 'none',
        height: '1px',
        background: 'linear-gradient(to right, transparent, #7fbb6f, transparent)',
        margin: '30px 0',
      },
      a: {
        color: '#7fbb6f',
        textDecoration: 'none',
      },
      img: {
        maxWidth: '100%',
        borderRadius: '12px',
        margin: '20px 0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      },
      strong: {
        color: '#7fbb6f',
        fontWeight: '600',
      },
      mark: {
        backgroundColor: '#e8f5e9',
        padding: '2px 6px',
        borderRadius: '3px',
      },
    },
  },
  {
    id: 'vibrant',
    name: '活力撞色',
    description: '大胆配色，适合营销号',
    icon: '🎨',
    preview: '#ff6b6b',
    styles: {
      body: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        lineHeight: '1.8',
        color: '#333333',
        padding: '0',
        margin: '0',
      },
      h1: {
        fontSize: '22px',
        fontWeight: '800',
        color: '#ffffff',
        textAlign: 'center',
        margin: '30px 0 20px',
        padding: '15px 25px',
        background: 'linear-gradient(135deg, #ff6b6b, #ffa07a)',
        borderRadius: '8px',
      },
      h2: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#ff6b6b',
        margin: '25px 0 15px',
        padding: '10px 15px',
        backgroundColor: '#fff5f5',
        borderRadius: '6px',
        borderLeft: '4px solid #ff6b6b',
      },
      h3: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#e74c3c',
        margin: '20px 0 10px',
      },
      p: {
        margin: '15px 0',
        textAlign: 'justify',
      },
      blockquote: {
        margin: '20px 0',
        padding: '15px 20px',
        background: 'linear-gradient(135deg, #fff5f5, #fff0e6)',
        borderLeft: '4px solid #ff6b6b',
        borderRadius: '0 8px 8px 0',
        color: '#666',
        fontSize: '14px',
      },
      list: {
        margin: '15px 0',
        paddingLeft: '25px',
      },
      hr: {
        border: 'none',
        height: '3px',
        background: 'linear-gradient(to right, #ff6b6b, #ffa07a, #ffd93d)',
        margin: '25px 0',
        borderRadius: '2px',
      },
      a: {
        color: '#ff6b6b',
        textDecoration: 'none',
        fontWeight: '600',
      },
      img: {
        maxWidth: '100%',
        borderRadius: '8px',
        margin: '15px 0',
        border: '3px solid #ff6b6b',
      },
      strong: {
        color: '#ff6b6b',
        fontWeight: '700',
      },
      mark: {
        backgroundColor: '#fff3cd',
        padding: '2px 6px',
        borderRadius: '3px',
        fontWeight: '600',
      },
    },
  },
  {
    id: 'magazine',
    name: '杂志排版',
    description: '分栏布局，适合资讯号',
    icon: '📰',
    preview: '#1a1a1a',
    styles: {
      body: {
        fontFamily: 'Georgia, "Times New Roman", "PingFang SC", "Microsoft YaHei", serif',
        fontSize: '15px',
        lineHeight: '1.9',
        color: '#1a1a1a',
        padding: '0',
        margin: '0',
      },
      h1: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1a1a1a',
        textAlign: 'center',
        margin: '30px 0 10px',
        letterSpacing: '3px',
      },
      h2: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#1a1a1a',
        margin: '30px 0 15px',
        paddingBottom: '10px',
        borderBottom: '2px solid #1a1a1a',
      },
      h3: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#333',
        margin: '20px 0 10px',
        fontStyle: 'italic',
      },
      p: {
        margin: '15px 0',
        textAlign: 'justify',
        textIndent: '2em',
      },
      blockquote: {
        margin: '25px 0',
        padding: '20px 25px',
        backgroundColor: '#f8f8f8',
        borderLeft: '4px solid #1a1a1a',
        color: '#444',
        fontSize: '14px',
        fontStyle: 'italic',
      },
      list: {
        margin: '15px 0',
        paddingLeft: '30px',
      },
      hr: {
        border: 'none',
        height: '1px',
        backgroundColor: '#1a1a1a',
        margin: '30px 0',
        width: '60%',
        marginLeft: 'auto',
        marginRight: 'auto',
      },
      a: {
        color: '#1a1a1a',
        textDecoration: 'underline',
      },
      img: {
        maxWidth: '100%',
        margin: '20px 0',
      },
      strong: {
        color: '#1a1a1a',
        fontWeight: '700',
      },
      mark: {
        backgroundColor: '#f0f0f0',
        padding: '2px 5px',
      },
    },
  },
  {
    id: 'card',
    name: '卡片式排版',
    description: '阴影卡片，适合产品介绍',
    icon: '🃏',
    preview: '#6c5ce7',
    styles: {
      body: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        lineHeight: '1.8',
        color: '#333333',
        padding: '0',
        margin: '0',
        backgroundColor: '#f5f6fa',
      },
      h1: {
        fontSize: '22px',
        fontWeight: '700',
        color: '#6c5ce7',
        textAlign: 'center',
        margin: '30px 0 20px',
      },
      h2: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#6c5ce7',
        margin: '25px 0 15px',
        padding: '15px 20px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
      h3: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#6c5ce7',
        margin: '20px 0 10px',
      },
      p: {
        margin: '15px 0',
        padding: '15px 20px',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        textAlign: 'justify',
      },
      blockquote: {
        margin: '20px 0',
        padding: '20px',
        backgroundColor: '#ffffff',
        borderLeft: '4px solid #6c5ce7',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        color: '#666',
        fontSize: '14px',
      },
      list: {
        margin: '15px 0',
        paddingLeft: '25px',
      },
      hr: {
        border: 'none',
        height: '1px',
        backgroundColor: '#e0e0e0',
        margin: '25px 0',
      },
      a: {
        color: '#6c5ce7',
        textDecoration: 'none',
      },
      img: {
        maxWidth: '100%',
        borderRadius: '12px',
        margin: '15px 0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      },
      strong: {
        color: '#6c5ce7',
        fontWeight: '700',
      },
      mark: {
        backgroundColor: '#f0edff',
        padding: '2px 6px',
        borderRadius: '3px',
      },
    },
  },
  {
    id: 'minimal',
    name: '极简留白',
    description: '大量留白，适合深度文章',
    icon: '✨',
    preview: '#2d3436',
    styles: {
      body: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: '16px',
        lineHeight: '2.2',
        color: '#2d3436',
        padding: '0',
        margin: '0',
      },
      h1: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#2d3436',
        textAlign: 'center',
        margin: '40px 0 30px',
        letterSpacing: '4px',
      },
      h2: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#2d3436',
        margin: '40px 0 20px',
        textAlign: 'center',
      },
      h3: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#555',
        margin: '30px 0 15px',
      },
      p: {
        margin: '20px 0',
        textAlign: 'justify',
      },
      blockquote: {
        margin: '30px 0',
        padding: '20px 0',
        borderLeft: 'none',
        color: '#888',
        fontSize: '15px',
        fontStyle: 'italic',
        textAlign: 'center',
      },
      list: {
        margin: '20px 0',
        paddingLeft: '25px',
      },
      hr: {
        border: 'none',
        height: '1px',
        backgroundColor: '#ddd',
        margin: '40px 20%',
      },
      a: {
        color: '#2d3436',
        textDecoration: 'underline',
      },
      img: {
        maxWidth: '100%',
        margin: '30px 0',
      },
      strong: {
        color: '#2d3436',
        fontWeight: '700',
      },
      mark: {
        backgroundColor: '#f8f8f8',
        padding: '2px 5px',
      },
    },
  },
  {
    id: 'tech',
    name: '科技极客',
    description: '深色主题，适合科技号',
    icon: '💻',
    preview: '#0d1117',
    styles: {
      body: {
        fontFamily: '"JetBrains Mono", "Fira Code", "PingFang SC", monospace',
        fontSize: '14px',
        lineHeight: '1.8',
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
        margin: '30px 0 20px',
        padding: '15px',
        backgroundColor: '#161b22',
        borderRadius: '8px',
        border: '1px solid #30363d',
      },
      h2: {
        fontSize: '17px',
        fontWeight: '600',
        color: '#58a6ff',
        margin: '25px 0 15px',
        padding: '10px 15px',
        backgroundColor: '#161b22',
        borderRadius: '6px',
        borderLeft: '4px solid #58a6ff',
      },
      h3: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#8b949e',
        margin: '20px 0 10px',
      },
      p: {
        margin: '15px 0',
        textAlign: 'justify',
      },
      blockquote: {
        margin: '20px 0',
        padding: '15px 20px',
        backgroundColor: '#161b22',
        borderLeft: '4px solid #58a6ff',
        borderRadius: '0 6px 6px 0',
        color: '#8b949e',
        fontSize: '13px',
      },
      list: {
        margin: '15px 0',
        paddingLeft: '25px',
      },
      hr: {
        border: 'none',
        height: '1px',
        backgroundColor: '#30363d',
        margin: '25px 0',
      },
      a: {
        color: '#58a6ff',
        textDecoration: 'none',
      },
      img: {
        maxWidth: '100%',
        borderRadius: '8px',
        margin: '15px 0',
        border: '1px solid #30363d',
      },
      strong: {
        color: '#58a6ff',
        fontWeight: '700',
      },
      mark: {
        backgroundColor: '#1f2937',
        padding: '2px 6px',
        borderRadius: '3px',
        color: '#f0883e',
      },
    },
  },
  {
    id: 'warm',
    name: '暖色调',
    description: '温馨舒适，适合情感号',
    icon: '🧡',
    preview: '#e17055',
    styles: {
      body: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        lineHeight: '1.9',
        color: '#4a4a4a',
        padding: '0',
        margin: '0',
      },
      h1: {
        fontSize: '21px',
        fontWeight: '700',
        color: '#e17055',
        textAlign: 'center',
        margin: '30px 0 20px',
        padding: '12px 0',
        borderBottom: '2px dashed #e17055',
      },
      h2: {
        fontSize: '17px',
        fontWeight: '600',
        color: '#e17055',
        margin: '25px 0 15px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      },
      h3: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#d35400',
        margin: '20px 0 10px',
      },
      p: {
        margin: '16px 0',
        textAlign: 'justify',
      },
      blockquote: {
        margin: '20px 0',
        padding: '18px',
        backgroundColor: '#fff5f0',
        borderLeft: '4px solid #e17055',
        borderRadius: '0 8px 8px 0',
        color: '#666',
        fontSize: '14px',
      },
      list: {
        margin: '15px 0',
        paddingLeft: '25px',
      },
      hr: {
        border: 'none',
        height: '2px',
        background: 'linear-gradient(to right, transparent, #e17055, transparent)',
        margin: '25px 0',
      },
      a: {
        color: '#e17055',
        textDecoration: 'none',
      },
      img: {
        maxWidth: '100%',
        borderRadius: '10px',
        margin: '15px 0',
        boxShadow: '0 3px 10px rgba(225, 112, 85, 0.2)',
      },
      strong: {
        color: '#e17055',
        fontWeight: '700',
      },
      mark: {
        backgroundColor: '#ffecd2',
        padding: '2px 6px',
        borderRadius: '3px',
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
