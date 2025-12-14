import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Sale } from '@/types';
import { toast } from 'sonner';

interface UseSalesParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

interface SalesResponse {
  data: Sale[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Get paginated sales list with filters
export function useSales(params: UseSalesParams = {}) {
  const { page = 1, limit = 20, startDate, endDate } = params;

  return useQuery<SalesResponse>({
    queryKey: ['sales', page, limit, startDate, endDate],
    queryFn: async () => {
      const response = await api.get('/sales', {
        params: {
          page,
          limit,
          startDate,
          endDate,
        },
      });
      return response.data;
    },
    staleTime: 30000, // 30 seconds
  });
}

// Get single sale by ID with details
export function useSaleById(id: string | null) {
  return useQuery<Sale>({
    queryKey: ['sales', id],
    queryFn: async () => {
      if (!id) throw new Error('Sale ID is required');
      const response = await api.get(`/sales/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}

// Export sales to CSV
export async function exportSalesToCSV(params: UseSalesParams = {}) {
  try {
    const response = await api.get('/sales/export', {
      params,
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast.success('Sales exported successfully');
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } };
    toast.error(err.response?.data?.message || 'Failed to export sales');
    throw error;
  }
}

// Get sales statistics
export function useSalesStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['sales', 'stats', startDate, endDate],
    queryFn: async () => {
      const response = await api.get('/sales/stats', {
        params: { startDate, endDate },
      });
      return response.data;
    },
    staleTime: 60000,
  });
}
