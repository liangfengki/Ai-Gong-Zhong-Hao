import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ImageLibraryPage } from '@/pages/ImageLibraryPage';
import { searchAllImages } from '@/services/api';
import { useAppStore } from '@/stores/useAppStore';
import type { ImageAsset } from '@/types';

const { navigateMock, toastInfoMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  toastInfoMock: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: toastInfoMock,
    success: vi.fn(),
  },
}));

vi.mock('@/services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api')>();
  return {
    ...actual,
    searchAllImages: vi.fn(),
  };
});

const makeImage = (id: string): ImageAsset => ({
  id,
  url: `/image-${id}.jpg`,
  thumbUrl: `/thumb-${id}.jpg`,
  alt: `图片 ${id}`,
  author: 'Lorem Flickr',
  source: 'unsplash',
  downloadUrl: `/download-${id}.jpg`,
});

describe('ImageLibraryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchAllImages).mockReset();
    useAppStore.setState({ pendingImageInserts: [] });
    vi.mocked(searchAllImages).mockResolvedValue({
      images: [makeImage('1')],
      sources: ['loremflickr-fallback'],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the default fallback image search only once on mount', async () => {
    render(<ImageLibraryPage />);

    await screen.findByText(/共找到/);

    expect(searchAllImages).toHaveBeenCalledTimes(1);
    expect(searchAllImages).toHaveBeenCalledWith({
      query: '风景',
      page: 1,
      pageSize: 15,
      orientation: undefined,
    });
  });

  it('uses the selected category and orientation for user searches', async () => {
    const user = userEvent.setup();
    render(<ImageLibraryPage />);

    await screen.findByText(/共找到/);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: '竖版' }));
    await user.click(screen.getByRole('button', { name: /科技/ }));

    await waitFor(() => {
      expect(searchAllImages).toHaveBeenLastCalledWith({
        query: '科技',
        page: 1,
        pageSize: 15,
        orientation: 'portrait',
      });
    });
  });

  it('loads more images by appending the next page', async () => {
    const user = userEvent.setup();
    vi.mocked(searchAllImages)
      .mockResolvedValueOnce({
        images: [makeImage('1')],
        sources: ['unsplash'],
      })
      .mockResolvedValueOnce({
        images: [makeImage('2')],
        sources: ['unsplash'],
      });

    render(<ImageLibraryPage />);

    await screen.findByRole('button', { name: '预览图片：图片 1' });
    await user.click(screen.getByRole('button', { name: /加载更多/ }));

    await screen.findByRole('button', { name: '预览图片：图片 2' });
    expect(screen.getByRole('button', { name: '预览图片：图片 1' })).toBeInTheDocument();
    expect(searchAllImages).toHaveBeenLastCalledWith({
      query: '风景',
      page: 2,
      pageSize: 15,
      orientation: undefined,
    });
  });

  it('queues an image insert and navigates back to the editor', async () => {
    const user = userEvent.setup();
    render(<ImageLibraryPage />);

    await screen.findByText(/共找到/);
    await user.click(screen.getByRole('button', { name: '插入到编辑器' }));

    expect(useAppStore.getState().pendingImageInserts).toEqual([
      { url: '/image-1.jpg', alt: '图片 1' },
    ]);
    expect(navigateMock).toHaveBeenCalledWith('/editor');
  });

  it('opens image preview from the keyboard', async () => {
    render(<ImageLibraryPage />);

    await screen.findByText(/共找到/);
    const previewAction = screen.getByRole('button', { name: '预览图片：图片 1' });
    previewAction.focus();
    await userEvent.keyboard('{Enter}');

    expect(screen.getByRole('dialog', { name: /图片预览/ })).toBeVisible();
  });

  it('falls back to opening the download URL with clear feedback when direct download fails', async () => {
    const user = userEvent.setup();
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('cors')) as typeof fetch;
    const clickMock = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    render(<ImageLibraryPage />);

    await screen.findByText(/共找到/);
    await user.click(screen.getByRole('button', { name: '下载图片' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/download-1.jpg', { mode: 'cors' });
    });
    expect(clickMock).toHaveBeenCalled();
    expect(toastInfoMock).toHaveBeenCalledWith('已打开图片链接', {
      description: '浏览器无法直接下载时，可在新页面手动保存图片',
    });
  });
});
