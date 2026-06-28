import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { useAppStore } from '@/stores/useAppStore';

describe('RichTextEditor', () => {
  it('unmount does not throw', async () => {
    const { unmount, container } = render(
      <RichTextEditor content="<p>hi</p>" onChange={() => {}} />
    );

    await waitFor(() => {
      expect(container.querySelector('.wechat-editor')).toBeTruthy();
    });

    expect(() => unmount()).not.toThrow();
  });

  it('applies external content updates after the user has edited', async () => {
    const { container, rerender } = render(
      <RichTextEditor content="<p>原始内容</p>" onChange={() => {}} />
    );

    const editable = await waitFor(() => {
      const el = container.querySelector('.ProseMirror') as HTMLElement | null;
      expect(el).toBeTruthy();
      return el!;
    });

    await userEvent.click(editable);
    await userEvent.type(editable, ' 用户输入');

    rerender(<RichTextEditor content={'<p style="color: red;">外部排版内容</p>'} onChange={() => {}} />);

    await waitFor(() => {
      const html = container.querySelector('.ProseMirror')?.innerHTML || '';
      expect(html).toContain('外部排版内容');
      expect(html).toContain('color: red');
    });
  });

  it('applies content that arrives after mounting with an empty document', async () => {
    const { container, rerender } = render(
      <RichTextEditor content="" onChange={() => {}} />
    );

    await waitFor(() => {
      expect(container.querySelector('.ProseMirror')).toBeTruthy();
    });

    rerender(<RichTextEditor content="<h2>小标题</h2><p>延迟载入正文</p>" onChange={() => {}} />);

    await waitFor(() => {
      const text = container.querySelector('.ProseMirror')?.textContent || '';
      expect(text).toContain('延迟载入正文');
    });
  });

  it('inserts images queued by the image library when the editor opens', async () => {
    const handleChange = vi.fn();
    useAppStore.setState({
      pendingImageInserts: [{ url: '/queued-image.jpg', alt: '队列图片' }],
    });

    const { container } = render(
      <RichTextEditor content="" onChange={handleChange} />
    );

    await waitFor(() => {
      const image = container.querySelector('.ProseMirror img');
      expect(image).toHaveAttribute('src', '/queued-image.jpg');
      expect(image).toHaveAttribute('alt', '队列图片');
    });
    expect(useAppStore.getState().pendingImageInserts).toEqual([]);
    expect(handleChange).toHaveBeenCalledWith(expect.stringContaining('/queued-image.jpg'));
  });

  it('calls onSave from the editor when pressing the keyboard save shortcut', async () => {
    const handleSave = vi.fn();
    const { container } = render(
      <RichTextEditor content="<p>快捷键正文</p>" onChange={() => {}} onSave={handleSave} />
    );

    const editable = await waitFor(() => {
      const el = container.querySelector('.ProseMirror') as HTMLElement | null;
      expect(el).toBeTruthy();
      return el!;
    });

    await userEvent.click(editable);
    await userEvent.keyboard('{Meta>}s{/Meta}');

    expect(handleSave).toHaveBeenCalledTimes(1);
  });
});
