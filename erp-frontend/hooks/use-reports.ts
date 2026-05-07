import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { CashReport, SalesReport, StockReport } from '@/types';

interface SalesReportParams {
  start?: string;
  end?: string;
}

interface StockReportParams {
  productId?: string;
  start?: string;
  end?: string;
  limit?: number;
}

export function useSalesReport(params: SalesReportParams = {}) {
  return useQuery<SalesReport>({
    queryKey: ['reports', 'sales', params],
    queryFn: async () => {
      const response = await api.get('/reports/sales', { params });
      return response.data;
    },
    staleTime: 30000,
  });
}

export function useStockReport(params: StockReportParams = {}) {
  return useQuery<StockReport>({
    queryKey: ['reports', 'stock-movements', params],
    queryFn: async () => {
      const response = await api.get('/reports/stock-movements', { params });
      return response.data;
    },
    staleTime: 30000,
  });
}

export function useCashReport(date?: string) {
  return useQuery<CashReport>({
    queryKey: ['reports', 'cash', date],
    queryFn: async () => {
      const response = await api.get('/reports/cash', {
        params: { date },
      });
      return response.data;
    },
    staleTime: 30000,
  });
}
