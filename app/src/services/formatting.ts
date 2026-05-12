/**
 * @deprecated Use applyStyleToContent from @/lib/formatUtils for WeChat formatting.
 * This function expects Markdown input, NOT HTML.
 */
export function markdownToHtml(markdown: string): string {
  let html = markdown
    // 标题
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // 粗体
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // 斜体
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 删除线
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    // 图片
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" />')
    // 链接
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    // 无序列表
    .replace(/^\s*[-*+]\s+(.*$)/gm, '<li>$1</li>')
    // 有序列表
    .replace(/^\s*\d+\.\s+(.*$)/gm, '<li>$1</li>')
    // 引用
    .replace(/^\s*>\s+(.*$)/gm, '<blockquote>$1</blockquote>')
    // 分隔线
    .replace(/^[-*_]{3,}\s*$/gm, '<hr />')
    // 段落（连续两个换行）
    .replace(/\n\n/g, '</p><p>')
    // 单个换行
    .replace(/\n/g, '<br />');

  // 包装段落
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`;
  }

  // 清理空段落
  html = html.replace(/<p><\/p>/g, '');

  // 合并相邻的li标签
  html = html.replace(/<\/li><br \/><li>/g, '</li><li>');

  // 包装列表
  html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');

  // 合并相邻的blockquote
  html = html.replace(/<\/blockquote><br \/><blockquote>/g, '<br />');

  return html;
}
