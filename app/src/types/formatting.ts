/**
 * @deprecated Use StyleTemplate from @/lib/styleTemplates instead.
 * This type and its templates are unused by any active code path.
 */

export interface FormattingTemplate {
  id: string;
  name: string;
  description: string;
  category: 'classic' | 'modern' | 'creative' | 'business';
  styles: {
    body: string;
    heading1: string;
    heading2: string;
    heading3: string;
    paragraph: string;
    blockquote: string;
    list: string;
    link: string;
    image: string;
    separator: string;
  };
}

export const formattingTemplates: FormattingTemplate[] = [
  {
    id: 'classic',
    name: '经典简约',
    description: '简洁大方，适合大多数公众号',
    category: 'classic',
    styles: {
      body: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.75; padding: 20px;',
      heading1: 'font-size: 24px; font-weight: bold; color: #2c3e50; margin: 28px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #3498db;',
      heading2: 'font-size: 20px; font-weight: bold; color: #34495e; margin: 24px 0 12px; padding-left: 10px; border-left: 4px solid #3498db;',
      heading3: 'font-size: 18px; font-weight: bold; color: #7f8c8d; margin: 20px 0 10px;',
      paragraph: 'margin: 12px 0; line-height: 1.75; text-align: justify;',
      blockquote: 'margin: 16px 0; padding: 12px 16px; background-color: #f8f9fa; border-left: 4px solid #3498db; color: #666; font-style: italic;',
      list: 'margin: 12px 0; padding-left: 24px;',
      link: 'color: #3498db; text-decoration: none; border-bottom: 1px solid #3498db;',
      image: 'max-width: 100%; height: auto; margin: 16px 0; border-radius: 4px;',
      separator: 'border: none; border-top: 1px solid #eee; margin: 24px 0;'
    }
  },
  {
    id: 'modern',
    name: '现代时尚',
    description: '时尚设计，适合科技、设计类公众号',
    category: 'modern',
    styles: {
      body: 'font-family: "Helvetica Neue", Arial, sans-serif; font-size: 16px; color: #1a1a1a; line-height: 1.8; padding: 24px; background-color: #fafafa;',
      heading1: 'font-size: 28px; font-weight: 700; color: #000; margin: 32px 0 20px; letter-spacing: -0.5px;',
      heading2: 'font-size: 22px; font-weight: 600; color: #333; margin: 28px 0 16px; letter-spacing: -0.3px;',
      heading3: 'font-size: 18px; font-weight: 600; color: #555; margin: 24px 0 12px;',
      paragraph: 'margin: 14px 0; line-height: 1.8; color: #333;',
      blockquote: 'margin: 20px 0; padding: 16px 20px; background-color: #fff; border-left: 4px solid #000; box-shadow: 0 2px 8px rgba(0,0,0,0.05);',
      list: 'margin: 14px 0; padding-left: 20px; color: #444;',
      link: 'color: #000; text-decoration: none; border-bottom: 2px solid #000; font-weight: 500;',
      image: 'max-width: 100%; height: auto; margin: 20px 0; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);',
      separator: 'border: none; height: 1px; background: linear-gradient(to right, transparent, #ccc, transparent); margin: 28px 0;'
    }
  },
  {
    id: 'creative',
    name: '创意活力',
    description: '色彩丰富，适合生活、娱乐类公众号',
    category: 'creative',
    styles: {
      body: 'font-family: "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 16px; color: #2d3436; line-height: 1.8; padding: 20px;',
      heading1: 'font-size: 26px; font-weight: bold; color: #e17055; margin: 28px 0 16px; padding: 8px 12px; background: linear-gradient(90deg, #ffeaa7, transparent); border-radius: 4px;',
      heading2: 'font-size: 22px; font-weight: bold; color: #6c5ce7; margin: 24px 0 14px; position: relative; padding-left: 16px;',
      heading3: 'font-size: 18px; font-weight: bold; color: #00b894; margin: 20px 0 10px;',
      paragraph: 'margin: 12px 0; line-height: 1.8; color: #2d3436;',
      blockquote: 'margin: 16px 0; padding: 14px 18px; background: linear-gradient(135deg, #a29bfe, #6c5ce7); color: #fff; border-radius: 8px; font-style: italic;',
      list: 'margin: 12px 0; padding-left: 20px; color: #2d3436;',
      link: 'color: #e17055; text-decoration: none; border-bottom: 1px dashed #e17055;',
      image: 'max-width: 100%; height: auto; margin: 16px 0; border-radius: 12px; box-shadow: 0 6px 16px rgba(0,0,0,0.15);',
      separator: 'border: none; height: 3px; background: linear-gradient(90deg, #e17055, #fdcb6e, #00b894, #6c5ce7); margin: 24px 0; border-radius: 2px;'
    }
  },
  {
    id: 'business',
    name: '商务专业',
    description: '专业稳重，适合企业、金融类公众号',
    category: 'business',
    styles: {
      body: 'font-family: "Georgia", "Times New Roman", serif; font-size: 16px; color: #2c3e50; line-height: 1.8; padding: 24px;',
      heading1: 'font-size: 26px; font-weight: bold; color: #1a5276; margin: 30px 0 18px; text-align: center; padding-bottom: 12px; border-bottom: 2px solid #1a5276;',
      heading2: 'font-size: 22px; font-weight: bold; color: #2c3e50; margin: 26px 0 14px; padding: 8px 12px; background-color: #f2f3f4; border-left: 5px solid #1a5276;',
      heading3: 'font-size: 18px; font-weight: bold; color: #34495e; margin: 22px 0 10px;',
      paragraph: 'margin: 14px 0; line-height: 1.8; text-indent: 2em; text-align: justify;',
      blockquote: 'margin: 18px 0; padding: 16px 20px; background-color: #f8f9fa; border-left: 5px solid #1a5276; color: #555;',
      list: 'margin: 14px 0; padding-left: 24px; color: #2c3e50;',
      link: 'color: #1a5276; text-decoration: none; border-bottom: 1px solid #1a5276;',
      image: 'max-width: 100%; height: auto; margin: 18px 0; border: 1px solid #ddd;',
      separator: 'border: none; border-top: 2px solid #1a5276; margin: 26px 0;'
    }
  }
];

export function getTemplateById(id: string): FormattingTemplate | undefined {
  return formattingTemplates.find(t => t.id === id);
}