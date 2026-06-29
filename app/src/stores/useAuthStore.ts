import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  username?: string | null;
}

export function normalizeErrorPayload(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  if (value && typeof value === 'object') {
    const payload = value as { message?: unknown; error?: unknown; code?: unknown };
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }
    if (typeof payload.code === 'string' && payload.code.trim()) {
      return `${fallback}（${payload.code}）`;
    }
  }
  return fallback;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return normalizeErrorPayload(error.response?.data?.error ?? error.response?.data, fallback);
  }
  return fallback;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, code: string, username?: string) => Promise<{ success: boolean; error?: string }>;
  requestCode: (email: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

const PROXY_BASE = '/api';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      requestCode: async (email: string) => {
        try {
          await axios.post(`${PROXY_BASE}/auth/register/request-code`, { email });
          return { success: true };
        } catch (error: unknown) {
          return { success: false, error: getErrorMessage(error, '发送验证码失败') };
        }
      },

      register: async (email: string, password: string, code: string, username?: string) => {
        try {
          const { data } = await axios.post(`${PROXY_BASE}/auth/register/verify`, { email, password, code, username });
          set({ user: data.user, token: data.token, isAuthenticated: true });
          return { success: true };
        } catch (error: unknown) {
          return { success: false, error: getErrorMessage(error, '注册失败') };
        }
      },

      login: async (email: string, password: string) => {
        try {
          const { data } = await axios.post(`${PROXY_BASE}/auth/login`, { email, password });
          set({ user: data.user, token: data.token, isAuthenticated: true });
          return { success: true };
        } catch (error: unknown) {
          return { success: false, error: getErrorMessage(error, '登录失败') };
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      changePassword: async (oldPassword: string, newPassword: string) => {
        const { token } = get();
        try {
          await axios.put(
            `${PROXY_BASE}/auth/change-password`,
            { oldPassword, newPassword },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          return { success: true };
        } catch (error: unknown) {
          return { success: false, error: getErrorMessage(error, '修改密码失败') };
        }
      },

      loadUser: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const { data } = await axios.get(`${PROXY_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          set({ user: data.user, isAuthenticated: true });
        } catch {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token }),
    }
  )
);
