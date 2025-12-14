import { useAuthStore } from '@/lib/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { AuthResponse, LoginCredentials, User } from '@/types';
import { setTenantId } from '@/lib/tenant';
import { toast } from 'sonner';

export function useAuth() {
  const { user, token, setAuth, logout, isAuthenticated, hasRole } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated: isAuthenticated(),
    hasRole,
    setAuth,
    logout,
  };
}

export function useLogin() {
  const { setAuth } = useAuthStore();

  return useMutation<AuthResponse, Error, LoginCredentials>({
    mutationFn: async (credentials) => {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.access_token);
      // Store tenantId from user object for subsequent requests
      if (data.user.tenantId) {
        setTenantId(data.user.tenantId);
      }
      toast.success('Login realizado com sucesso!');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha no login');
    },
  });
}

export interface RegisterData {
  company: {
    name: string;
    email: string;
    phone?: string;
  };
  user: {
    fullName: string;
    email: string;
    password: string;
  };
}

export function useRegister() {
  const { setAuth } = useAuthStore();

  return useMutation<AuthResponse, Error, RegisterData>({
    mutationFn: async (data) => {
      const response = await api.post('/auth/register', data);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.access_token);
      // Store tenantId from user object for subsequent requests
      if (data.user.tenantId) {
        setTenantId(data.user.tenantId);
      }
      toast.success('Conta criada com sucesso!');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao criar conta');
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return () => {
    logout();
    queryClient.clear();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };
}

export function useCurrentUser() {
  const { isAuthenticated } = useAuth();

  return useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
