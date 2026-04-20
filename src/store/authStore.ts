import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_URL } from '@/lib/api';
import { fetchJson } from '@/lib/http';

interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        try {
          const data = await fetchJson(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });
          if (!data?.token || !data?.user) return { success: false, error: 'Invalid server response' };
          set({ token: data.token, user: data.user, isAuthenticated: true });
          return { success: true };
        } catch (err: any) {
          return { success: false, error: err?.message || 'Login failed' };
        }
      },

      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    { name: 'zifa-auth' }
  )
);

// Helper to get auth headers for protected API calls
export const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getAuthToken = () => useAuthStore.getState().token;
