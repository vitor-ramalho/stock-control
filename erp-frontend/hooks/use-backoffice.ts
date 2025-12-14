import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export function useBackofficeTenants() {
  return useQuery<Tenant[]>({
    queryKey: ['backoffice-tenants'],
    queryFn: async () => {
      const response = await api.get('/backoffice/tenants');
      return response.data;
    },
  });
}

export function useBackofficeTenant(id: string) {
  return useQuery<Tenant>({
    queryKey: ['backoffice-tenant', id],
    queryFn: async () => {
      const response = await api.get(`/backoffice/tenants/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useBackofficeTenantUsers(id: string) {
  return useQuery<TenantUser[]>({
    queryKey: ['backoffice-tenant-users', id],
    queryFn: async () => {
      const response = await api.get(`/backoffice/tenants/${id}/users`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useToggleTenantStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await api.patch(`/backoffice/tenants/${id}/status`, {
        isActive,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backoffice-tenants'] });
      toast.success('Status da empresa atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Falha ao atualizar status da empresa');
    },
  });
}
