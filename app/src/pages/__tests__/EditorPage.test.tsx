import { act, render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EditorPage } from '@/pages/EditorPage';
import { useAppStore } from '@/stores/useAppStore';

describe('EditorPage', () => {
  it('keeps an image inserted from the image library after editor initialization settles', async () => {
    useAppStore.setState({
      currentArticle: null,
      articles: [],
      articleVersions: [],
      pendingImageInserts: [{ url: '/queued-image.jpg', alt: '队列图片' }],
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/editor']}>
        <Routes>
          <Route path="/editor" element={<EditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(container.querySelector('.ProseMirror')).toBeTruthy();
    });

    await waitFor(() => {
      expect(useAppStore.getState().currentArticle?.id).toBeTruthy();
    });

    await waitFor(() => {
      const image = container.querySelector('.ProseMirror img');
      expect(image).toHaveAttribute('src', '/queued-image.jpg');
      expect(image).toHaveAttribute('alt', '队列图片');
    });
    expect(useAppStore.getState().pendingImageInserts).toEqual([]);
  });

  it('creates a version when the user saves an existing article with the keyboard shortcut', async () => {
    const article = {
      id: 'shortcut-article',
      title: '快捷键文章',
      content: '<p>快捷键正文</p>',
      wordCount: 5,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft' as const,
    };
    useAppStore.setState({
      currentArticle: null,
      articles: [article],
      articleVersions: [],
      pendingImageInserts: [],
    });

    render(
      <MemoryRouter initialEntries={[{ pathname: '/editor', state: { articleId: article.id } }]}>
        <Routes>
          <Route path="/editor" element={<EditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(useAppStore.getState().currentArticle?.id).toBe(article.id);
    });

    const editor = document.querySelector('.ProseMirror');
    act(() => {
      editor?.dispatchEvent(new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      }));
    });

    await waitFor(() => {
      const versions = useAppStore.getState().articleVersions;
      expect(versions).toHaveLength(1);
      expect(versions[0]).toMatchObject({
        articleId: article.id,
        title: article.title,
        content: article.content,
      });
    });
  });
});
