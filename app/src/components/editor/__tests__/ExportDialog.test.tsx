import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ExportDialog } from '@/components/editor/ExportDialog';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

describe('ExportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:export') as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn() as typeof URL.revokeObjectURL;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  it('exposes every export format as a named keyboard-accessible action', async () => {
    render(<ExportDialog title="测试文章" content="<p>正文</p>" />);

    await userEvent.click(screen.getByRole('button', { name: /导出文章/ }));

    expect(screen.getByRole('button', { name: '导出 Markdown' })).toBeVisible();
    expect(screen.getByRole('button', { name: '导出 HTML' })).toBeVisible();
    expect(screen.getByRole('button', { name: '导出 PDF' })).toBeVisible();
    expect(screen.getByRole('button', { name: '导出 Word' })).toBeVisible();
    expect(screen.getByRole('button', { name: '导出纯文本' })).toBeVisible();

    screen.getByRole('button', { name: '导出 Markdown' }).focus();
    await userEvent.keyboard('{Enter}');

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  });
});
