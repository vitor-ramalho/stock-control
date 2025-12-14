import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { CashRegister, FinancialEntry, OpenCashRegisterFormData, CloseCashRegisterFormData, FinancialEntryFormData } from '@/types';
import { toast } from 'sonner';

// Get current active cash register session
export function useCurrentCashRegister() {
  return useQuery<CashRegister | null>({
    queryKey: ['cash-register', 'current'],
    queryFn: async () => {
      try {
        const response = await api.get('/cash/current');
        return response.data;
      } catch (error) {
        // Return null if no active session (404 is expected)
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    refetchInterval: 30000, // Poll every 30 seconds for real-time updates
    retry: false,
  });
}

// Get cash register entries/movements
export function useCashRegisterMovements(cashRegisterId?: string) {
  return useQuery<FinancialEntry[]>({
    queryKey: ['cash-register', 'movements', cashRegisterId],
    queryFn: async () => {
      if (!cashRegisterId) return [];
      const response = await api.get(`/finance/entries/register/${cashRegisterId}`);
      return response.data;
    },
    enabled: !!cashRegisterId,
    refetchInterval: 10000,
  });
}

// Open cash register
export function useOpenCashRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OpenCashRegisterFormData) => {
      const response = await api.post('/cash/open', {
        initialBalance: data.initialBalance,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register'] });
      toast.success('Caixa aberto com sucesso!');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao abrir caixa');
    },
  });
}

// Close cash register
export function useCloseCashRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CloseCashRegisterFormData) => {
      const response = await api.post('/cash/close', {
        finalBalance: data.finalBalance,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register'] });
      toast.success('Caixa fechado com sucesso!');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao fechar caixa');
    },
  });
}

// Register a manual movement (income/expense)
export function useRegisterMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FinancialEntryFormData) => {
      const response = await api.post('/finance/entry', {
        type: data.type,
        category: data.category || 'other',
        value: data.value,
        description: data.description,
        paymentMethod: data.paymentMethod,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register'] });
      toast.success('Movimentação registrada com sucesso!');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao registrar movimentação');
    },
  });
}

// Get daily report
export function useDailyReport(date?: string) {
  return useQuery({
    queryKey: ['cash-register', 'daily-report', date],
    queryFn: async () => {
      const response = await api.get('/cash/report/daily', {
        params: { date },
      });
      return response.data;
    },
    enabled: !!date,
  });
}
