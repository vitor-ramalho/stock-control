import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Customer, CustomerFormData, PaginatedResponse } from '@/types';
import { toast } from 'sonner';

interface UseCustomersParams {
  page?: number;
  limit?: number;
  q?: string;
  isActive?: boolean;
}

export function useCustomers(params: UseCustomersParams = {}) {
  const { page = 1, limit = 20, q, isActive } = params;

  return useQuery<PaginatedResponse<Customer>>({
    queryKey: ['customers', page, limit, q, isActive],
    queryFn: async () => {
      const response = await api.get('/customers', {
        params: {
          page,
          limit,
          q,
          isActive,
        },
      });
      return response.data;
    },
    staleTime: 30000,
  });
}

export function useSearchCustomers(query: string) {
  return useQuery<Customer[]>({
    queryKey: ['customers', 'search', query],
    queryFn: async () => {
      const response = await api.get('/customers/search', {
        params: { q: query },
      });
      return response.data;
    },
    enabled: query.trim().length >= 2,
    staleTime: 15000,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const response = await api.post('/customers', data);
      return response.data as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente criado com sucesso');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao criar cliente');
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CustomerFormData> }) => {
      const response = await api.patch(`/customers/${id}`, data);
      return response.data as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente atualizado com sucesso');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao atualizar cliente');
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente desativado com sucesso');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao desativar cliente');
    },
  });
}
