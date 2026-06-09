import { render, waitFor } from '@testing-library/react';
import { RichTextEditor } from '@/components/editor/RichTextEditor';

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
});

