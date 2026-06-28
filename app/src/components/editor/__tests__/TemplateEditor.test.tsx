import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TemplateEditor } from '@/components/editor/TemplateEditor';

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
  },
}));

describe('TemplateEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('labels color swatches and applies the selected swatch from the keyboard', async () => {
    render(<TemplateEditor onSave={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /可视化编辑/ }));

    const accentColor = screen.getByRole('button', { name: '选择主题色 #ff6b6b' });
    accentColor.focus();
    await userEvent.keyboard('{Enter}');

    expect(accentColor).toHaveAttribute('aria-pressed', 'true');
  });
});
