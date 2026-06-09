import type { HTMLAttributes } from 'react';

/**
 * 安全渲染 HTML 内容。
 * 直接使用 dangerouslySetInnerHTML，React 会正确追踪 DOM 节点。
 * 之前的 removeChild 错误源于 Suspense 边界，现已移除。
 */
export function SafeHtml({
  html,
  ...props
}: { html: string } & HTMLAttributes<HTMLDivElement>) {
  return <div dangerouslySetInnerHTML={{ __html: html }} {...props} />;
}
