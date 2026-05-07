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

interface TenantUserFormData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'cashier' | 'user';
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

export function useCreateTenantUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: TenantUserFormData;
    }) => {
      const response = await api.post(`/backoffice/tenants/${tenantId}/users`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['backoffice-tenant-users', variables.tenantId],
      });
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao criar usuário');
    },
  });
}

export function useToggleTenantUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      userId,
      isActive,
    }: {
      tenantId: string;
      userId: string;
      isActive: boolean;
    }) => {
      const response = await api.patch(
        `/backoffice/tenants/${tenantId}/users/${userId}/status`,
        {
          isActive,
        },
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['backoffice-tenant-users', variables.tenantId],
      });
      toast.success('Status do usuário atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Falha ao atualizar status do usuário');
    },
  });
}
