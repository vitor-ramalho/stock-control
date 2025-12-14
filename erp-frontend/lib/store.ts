import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { clearTenantId } from './tenant';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (roles: User['role'][]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        set({ user, token });
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        }
      },
      logout: () => {
        set({ user: null, token: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          clearTenantId();
        }
      },
      isAuthenticated: () => {
        const { token, user } = get();
        return !!token && !!user;
      },
      hasRole: (roles) => {
        const { user } = get();
        return !!user && roles.includes(user.role);
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
