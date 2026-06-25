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

/**
 * Escape HTML special characters to prevent XSS and rendering issues.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Convert inline markdown syntax to HTML.
 * Processes bold, italic, inline code. Text outside of markdown
 * syntax is HTML-escaped.
 */
function processInline(text: string): string {
  // First, extract inline code spans so their content isn't processed
  const codeSpans: string[] = [];
  let processed = text.replace(/`([^`]+)`/g, (_, code) => {
    const placeholder = `\x00CODE${codeSpans.length}\x00`;
    codeSpans.push(`<code>${escapeHtml(code)}</code>`);
    return placeholder;
  });

  // Escape HTML in the remaining text
  processed = escapeHtml(processed);

  // Bold: **text** (must come before italic to avoid conflict)
  processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic: *text* or _text_
  processed = processed.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  processed = processed.replace(/(?<!\w)_(.+?)_(?!\w)/g, '<em>$1</em>');

  // Restore inline code spans
  processed = processed.replace(/\x00CODE(\d+)\x00/g, (_, idx) => codeSpans[Number(idx)]);

  return processed;
}

/**
 * Convert markdown text to HTML using pure regex.
 * Supports headings, bold, italic, lists (ul/ol), blockquotes,
 * horizontal rules, inline code, and paragraphs.
 *
 * Designed to handle typical AI streaming output patterns.
 *
 * @param md - Raw markdown string
 * @returns HTML string
 */
export function markdownToHtml(md: string): string {
  if (!md) return '';

  // Normalize line endings
  let text = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into lines for block-level processing
  const lines = text.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line — skip (serves as paragraph separator)
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Horizontal rule: --- or *** (at least 3 chars, optional spaces)
    if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
      result.push('<hr>');
      i++;
      continue;
    }

    // Headings: # ... ######
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      result.push(`<h${level}>${processInline(headingMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    // Blockquote: > text (collect consecutive lines)
    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      result.push(`<blockquote>${processInline(quoteLines.join('\n'))}</blockquote>`);
      continue;
    }

    // Unordered list: - or * item
    if (/^[\s]*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\s]*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[\s]*[-*]\s+/, ''));
        i++;
      }
      const lis = items.map(item => `<li>${processInline(item)}</li>`).join('');
      result.push(`<ul>${lis}</ul>`);
      continue;
    }

    // Ordered list: 1. item
    if (/^[\s]*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\s]*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[\s]*\d+\.\s+/, ''));
        i++;
      }
      const lis = items.map(item => `<li>${processInline(item)}</li>`).join('');
      result.push(`<ol>${lis}</ol>`);
      continue;
    }

    // Regular paragraph: collect consecutive non-blank, non-block lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^#{1,6}\s+/.test(lines[i]) &&
      !/^(\s*[-*_]\s*){3,}$/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^[\s]*[-*]\s+/.test(lines[i]) &&
      !/^[\s]*\d+\.\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      // Single newlines within a paragraph become spaces
      const content = processInline(paraLines.join(' '));
      result.push(`<p>${content}</p>`);
    }
  }

  return result.join('');
}
