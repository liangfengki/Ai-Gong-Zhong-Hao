import type { StyleTemplate } from './styleTemplates';
import { styleTemplates } from './styleTemplates';

/**
 * Apply inline styles from a StyleTemplate to HTML content.
 * Parses the HTML with DOMParser and applies CSSProperties to matching elements.
 * Used for WeChat-compatible formatting (inline styles only, no external CSS).
 */
export function applyStyleToContent(html: string, template: StyleTemplate): string {
  const { styles } = template;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  // Apply global body styles
  Object.assign(body.style, styles.body);

  // Headings
  const headings = body.querySelectorAll('h1, h2, h3');
  headings.forEach(heading => {
    const el = heading as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (tag === 'h1') Object.assign(el.style, styles.h1);
    if (tag === 'h2') Object.assign(el.style, styles.h2);
    if (tag === 'h3') Object.assign(el.style, styles.h3);
  });

  // Paragraphs
  const paragraphs = body.querySelectorAll('p');
  paragraphs.forEach(p => Object.assign((p as HTMLElement).style, styles.p));

  // Blockquotes
  const quotes = body.querySelectorAll('blockquote');
  quotes.forEach(q => Object.assign((q as HTMLElement).style, styles.blockquote));

  // Lists
  const lists = body.querySelectorAll('ul, ol');
  lists.forEach(list => Object.assign((list as HTMLElement).style, styles.list));

  // Horizontal rules
  const hrs = body.querySelectorAll('hr');
  hrs.forEach(hr => Object.assign((hr as HTMLElement).style, styles.hr));

  // Links
  const links = body.querySelectorAll('a');
  links.forEach(a => Object.assign((a as HTMLElement).style, styles.a));

  // Images
  const images = body.querySelectorAll('img');
  images.forEach(img => Object.assign((img as HTMLElement).style, styles.img));

  // Bold
  const bolds = body.querySelectorAll('strong, b');
  bolds.forEach(b => Object.assign((b as HTMLElement).style, styles.strong));

  // Highlight
  const marks = body.querySelectorAll('mark');
  marks.forEach(mark => Object.assign((mark as HTMLElement).style, styles.mark));

  return body.innerHTML;
}

/**
 * Get the default style template for copy-to-clipboard operations.
 */
export function getDefaultStyleTemplate(): StyleTemplate {
  return styleTemplates[0];
}
