import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { ProtectedRoute } from '@/App';
import { useAuthStore } from '@/stores/useAuthStore';

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={(
            <ProtectedRoute>
              <div>受保护内容</div>
            </ProtectedRoute>
          )}
        />
        <Route path="/login" element={<button>登录</button>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      authReady: false,
    });
  });

  it('waits for auth recovery instead of redirecting while auth is not ready', () => {
    renderProtectedRoute();

    expect(screen.getByText('正在恢复登录状态...')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '登录' })).not.toBeInTheDocument();
  });

  it('shows protected content after auth recovery succeeds', () => {
    useAuthStore.setState({
      user: { id: 'user-1', email: 'user@example.com' },
      token: 'token-1',
      isAuthenticated: true,
      authReady: true,
    });

    renderProtectedRoute();

    expect(screen.getByText('受保护内容')).toBeInTheDocument();
  });

  it('redirects to login only after auth recovery completes unauthenticated', async () => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      authReady: true,
    });

    renderProtectedRoute();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
    });
  });
});
