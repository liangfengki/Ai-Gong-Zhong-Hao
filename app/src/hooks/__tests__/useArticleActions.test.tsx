import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useArticleActions } from '@/hooks/useArticleActions';

const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccess,
    error: toastError,
  },
}));

describe('useArticleActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('falls back to plain text copy when rich clipboard items are unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    Object.defineProperty(window, 'ClipboardItem', {
      configurable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useArticleActions('标题', '<p>正文</p>'));

    await act(async () => {
      await result.current.handleCopyForWechat();
    });

    expect(writeText).toHaveBeenCalledWith('<p>正文</p>');
    expect(toastSuccess).toHaveBeenCalledWith('复制成功', {
      description: '已复制公众号格式，可直接粘贴到公众号编辑器',
    });
  });

  it('shows a copy failure toast when clipboard write is rejected', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('denied')),
      },
    });

    const { result } = renderHook(() => useArticleActions('标题', '正文'));

    await act(async () => {
      await result.current.handleCopy();
    });

    expect(toastError).toHaveBeenCalledWith('复制失败', {
      description: '请检查浏览器剪贴板权限后重试',
    });
  });
});
