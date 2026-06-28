import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ContentAnalysis } from '@/components/editor/ContentAnalysis';
import { analyzeContent } from '@/services/api';

vi.mock('@/services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api')>();
  return {
    ...actual,
    analyzeContent: vi.fn().mockResolvedValue({
      qualityScore: 82,
      seo: { score: 76, suggestions: ['优化标题'] },
      readability: { score: 80, level: '适中', details: ['段落清晰'] },
      sentiment: { type: 'positive', score: 70, description: '积极' },
      improvements: ['补充案例'],
    }),
  };
});

describe('ContentAnalysis', () => {
  it('allows analysis without a browser API key so the server env key can be used', async () => {
    render(<ContentAnalysis title="测试标题" content="<p>这是一段可分析的正文内容。</p>" />);

    await userEvent.click(screen.getByRole('button', { name: /开始AI分析/ }));

    await waitFor(() => {
      expect(analyzeContent).toHaveBeenCalledWith(
        '测试标题',
        '<p>这是一段可分析的正文内容。</p>',
        '',
        'agnes-2.0-flash',
        'https://apihub.agnes-ai.com/v1'
      );
    });
  });
});
