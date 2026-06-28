import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SafeHtml } from '@/components/ui/safe-html';

describe('SafeHtml', () => {
  it('removes script tags, event handlers, and javascript links', () => {
    render(
      <SafeHtml
        html={`<p onclick="alert(1)">正文</p><script>alert(1)</script><a href="javascript:alert(1)">危险链接</a>`}
      />
    );

    const root = screen.getByText('正文').parentElement?.parentElement;

    expect(root?.querySelector('script')).toBeNull();
    expect(root).not.toHaveTextContent('alert(1)');
    expect(screen.getByText('正文')).not.toHaveAttribute('onclick');
    expect(screen.getByText('危险链接')).not.toHaveAttribute('href');
  });

  it('keeps allowed article formatting and safe links', () => {
    render(
      <SafeHtml html={`<h2 style="color:#111">标题</h2><a href="https://example.com">安全链接</a>`} />
    );

    expect(screen.getByText('标题')).toHaveAttribute('style');
    expect(screen.getByText('安全链接')).toHaveAttribute('href', 'https://example.com');
    expect(screen.getByText('安全链接')).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
