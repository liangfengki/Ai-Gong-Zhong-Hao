import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OneClickFormat } from '@/components/editor/OneClickFormat';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe('OneClickFormat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes style templates as named keyboard actions', async () => {
    const handleApplyStyle = vi.fn();
    render(<OneClickFormat onApplyStyle={handleApplyStyle} />);

    await userEvent.click(screen.getByRole('button', { name: /一键排版/ }));

    const templateAction = screen.getByRole('button', { name: '应用简约商务排版风格' });
    templateAction.focus();
    await userEvent.keyboard('{Enter}');

    expect(handleApplyStyle).toHaveBeenCalledTimes(1);
  });
});
