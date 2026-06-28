import type { HTMLAttributes } from 'react';

const ALLOWED_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'section',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]);

const ALLOWED_ATTRS = new Set(['alt', 'class', 'href', 'src', 'style', 'target', 'title', 'rel']);
const DROP_WITH_CONTENT_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed']);

function isSafeUrl(value: string) {
  const trimmed = value.trim().toLowerCase();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:image/')
  );
}

function sanitizeHtml(html: string) {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return '';

  const cleanNode = (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    if (DROP_WITH_CONTENT_TAGS.has(tagName)) {
      element.remove();
      return;
    }

    if (!ALLOWED_TAGS.has(tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    for (const attr of Array.from(element.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value;
      const isEventHandler = name.startsWith('on');
      const isUnsafeUrl = (name === 'href' || name === 'src') && !isSafeUrl(value);

      if (!ALLOWED_ATTRS.has(name) || isEventHandler || isUnsafeUrl) {
        element.removeAttribute(attr.name);
      }
    }

    if (tagName === 'a') {
      element.setAttribute('rel', 'noopener noreferrer');
    }
  };

  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  const nodes: Node[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(cleanNode);

  return root.innerHTML;
}

export function SafeHtml({
  html,
  ...props
}: { html: string } & HTMLAttributes<HTMLDivElement>) {
  return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} {...props} />;
}
