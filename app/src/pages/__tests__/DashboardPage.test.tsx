import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from '@/pages/DashboardPage';
import { useAppStore } from '@/stores/useAppStore';

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api')>();
  return {
    ...actual,
    fetchAllHotTopics: vi.fn().mockResolvedValue({ topics: [] }),
  };
});

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      articles: [],
      hotTopics: [],
      settings: {
        ...useAppStore.getState().settings,
        skills: [],
      },
    });
  });

  it('exposes quick actions and onboarding steps as named keyboard actions', async () => {
    render(<DashboardPage />);

    const topicsAction = screen.getByRole('button', { name: /追热点/ });
    topicsAction.focus();
    await userEvent.keyboard('{Enter}');
    expect(navigateMock).toHaveBeenCalledWith('/topics');

    const writeStep = screen.getByRole('button', { name: '开始写作：创建第一篇文章' });
    writeStep.focus();
    await userEvent.keyboard(' ');
    expect(navigateMock).toHaveBeenCalledWith('/editor');
  });

  it('opens recent articles from the keyboard', async () => {
    useAppStore.setState({
      articles: [
        {
          id: 'article-1',
          title: '可访问的文章',
          content: '<p>正文</p>',
          status: 'draft',
          wordCount: 2,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          tags: [],
        },
      ],
    });

    render(<DashboardPage />);

    const articleAction = screen.getByRole('button', { name: /打开文章：可访问的文章/ });
    articleAction.focus();
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/editor', { state: { articleId: 'article-1' } });
    });
  });
});
