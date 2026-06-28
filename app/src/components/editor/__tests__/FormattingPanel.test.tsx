import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormattingPanel } from '@/components/editor/FormattingPanel';

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

const originalClipboardItem = window.ClipboardItem;

describe('FormattingPanel', () => {
  afterEach(() => {
    Object.defineProperty(window, 'ClipboardItem', {
      configurable: true,
      value: originalClipboardItem,
    });
  });

  it('falls back to plain text clipboard when rich HTML clipboard is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    Object.defineProperty(window, 'ClipboardItem', {
      configurable: true,
      value: undefined,
    });

    render(
      <FormattingPanel content="<p>已排版正文</p>" onApplyFormat={vi.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: /复制到公众号/ }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('<p>已排版正文</p>'));
    expect(toastSuccess).toHaveBeenCalledWith('已复制公众号格式，可直接粘贴到公众号编辑器');
  });

  it('applies formatting as the shared content used by copy and HTML download', async () => {
    const clipboardWrite = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        write: clipboardWrite,
      },
    });

    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:format-html');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const anchorClick = vi.fn();
    const createElement = vi.spyOn(document, 'createElement');
    createElement.mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
      const element = Document.prototype.createElement.call(document, tagName, options);
      if (tagName.toLowerCase() === 'a') {
        Object.defineProperty(element, 'click', { value: anchorClick });
      }
      return element;
    }) as typeof document.createElement);

    let sharedContent = '<h2>小标题</h2><p>正文</p>';
    const handleApplyFormat = vi.fn((formattedHtml: string) => {
      sharedContent = formattedHtml;
    });

    const { rerender } = render(
      <FormattingPanel content={sharedContent} onApplyFormat={handleApplyFormat} />
    );

    fireEvent.click(screen.getByText('简约商务'));

    expect(handleApplyFormat).toHaveBeenCalledTimes(1);
    expect(sharedContent).toContain('style=');

    rerender(<FormattingPanel content={sharedContent} onApplyFormat={handleApplyFormat} />);

    fireEvent.click(screen.getByRole('button', { name: /复制到公众号/ }));

    await waitFor(() => expect(clipboardWrite).toHaveBeenCalledTimes(1));
    const clipboardItem = clipboardWrite.mock.calls[0][0][0] as ClipboardItem;
    const copiedHtml = await (await clipboardItem.getType('text/html')).text();
    expect(copiedHtml).toBe(sharedContent);

    fireEvent.click(screen.getByRole('button', { name: /下载 HTML/ }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const downloadedBlob = createObjectURL.mock.calls[0][0] as Blob;
    const downloadedHtml = await downloadedBlob.text();
    expect(downloadedHtml).toContain(sharedContent);

    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
    createElement.mockRestore();
  });

  it('exposes template cards as clearly named keyboard actions', () => {
    const handleApplyFormat = vi.fn();

    render(
      <FormattingPanel content="<h2>小标题</h2><p>正文</p>" onApplyFormat={handleApplyFormat} />
    );

    const templateAction = screen.getByRole('button', { name: '应用简约商务排版模板' });
    templateAction.focus();
    fireEvent.keyDown(templateAction, { key: 'Enter' });
    fireEvent.click(templateAction);

    expect(handleApplyFormat).toHaveBeenCalledTimes(1);
  });
});
