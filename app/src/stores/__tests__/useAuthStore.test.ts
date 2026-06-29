import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeErrorPayload, useAuthStore } from '../useAuthStore';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    isAxiosError: vi.fn(() => false),
  },
}));

const mockedAxios = vi.mocked(axios);

describe('normalizeErrorPayload', () => {
  it('uses nested message text instead of returning render-unsafe objects', () => {
    expect(normalizeErrorPayload({ code: 'missing_parameter', message: '缺少参数' }, '发送验证码失败'))
      .toBe('缺少参数');
  });

  it('falls back with the error code when no message is available', () => {
    expect(normalizeErrorPayload({ code: 'invalid_sender' }, '发送验证码失败'))
      .toBe('发送验证码失败（invalid_sender）');
  });
});

describe('useAuthStore auth recovery', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      authReady: false,
    });
  });

  it('marks auth as ready without redirect-prone authenticated state when no token exists', async () => {
    await useAuthStore.getState().loadUser();

    expect(mockedAxios.get).not.toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      token: null,
      isAuthenticated: false,
      authReady: true,
    });
  });

  it('restores the user from a persisted token', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'user@example.com', username: 'User' } },
    });
    useAuthStore.setState({ token: 'token-1', authReady: false });

    await useAuthStore.getState().loadUser();

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/auth/me', {
      headers: { Authorization: 'Bearer token-1' },
    });
    expect(useAuthStore.getState()).toMatchObject({
      user: { id: 'user-1', email: 'user@example.com', username: 'User' },
      token: 'token-1',
      isAuthenticated: true,
      authReady: true,
    });
  });

  it('clears an invalid persisted token after auth recovery fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('unauthorized'));
    useAuthStore.setState({ token: 'expired-token', authReady: false });

    await useAuthStore.getState().loadUser();

    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      token: null,
      isAuthenticated: false,
      authReady: true,
    });
  });

  it('persists successful login tokens for page refresh recovery', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        token: 'login-token',
        user: { id: 'user-2', email: 'login@example.com', username: 'Login' },
      },
    });

    const result = await useAuthStore.getState().login('login@example.com', 'password');

    expect(result).toEqual({ success: true });
    expect(useAuthStore.getState()).toMatchObject({
      token: 'login-token',
      isAuthenticated: true,
      authReady: true,
    });
    expect(JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token).toBe('login-token');
  });
});
