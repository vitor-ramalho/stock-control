import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Product, StockInFormData, StockOutFormData, StockMovement } from '@/types';
import { toast } from 'sonner';

// Get products with stock information
export function useProductsWithStock() {
  return useQuery<Product[]>({
    queryKey: ['products', 'stock'],
    queryFn: async () => {
      const response = await api.get('/products', {
        params: { includeStock: true },
      });
      return response.data;
    },
  });
}

// Get stock movements for a product
export function useStockMovements(productId?: string) {
  return useQuery<StockMovement[]>({
    queryKey: ['stock', 'movements', productId],
    queryFn: async () => {
      const response = await api.get(`/stock/product/${productId}`);
      return response.data;
    },
    enabled: !!productId,
  });
}

// Stock In mutation
export function useStockIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StockInFormData) => {
      const response = await api.post('/stock/in', {
        productId: data.productId,
        quantity: data.quantity,
        origin: data.origin || 'Manual Entry',
        reason: data.reason,
      });
      return response.data;
    },
    onMutate: async (data) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['products', 'stock'] });

      // Snapshot previous value
      const previousProducts = queryClient.getQueryData<Product[]>(['products', 'stock']);

      // Optimistically update
      if (previousProducts) {
        queryClient.setQueryData<Product[]>(
          ['products', 'stock'],
          previousProducts.map((product) =>
            product.id === data.productId
              ? { ...product, quantity: product.quantity + data.quantity }
              : product
          )
        );
      }

      return { previousProducts };
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(['products', 'stock'], context.previousProducts);
      }
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to add stock');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products', 'stock'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock', 'movements', variables.productId] });
      toast.success('Stock added successfully');
    },
  });
}

// Stock Out mutation
export function useStockOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StockOutFormData) => {
      const response = await api.post('/stock/out', {
        productId: data.productId,
        quantity: data.quantity,
        origin: data.origin || 'Manual Entry',
        reason: data.reason,
      });
      return response.data;
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['products', 'stock'] });

      const previousProducts = queryClient.getQueryData<Product[]>(['products', 'stock']);

      if (previousProducts) {
        queryClient.setQueryData<Product[]>(
          ['products', 'stock'],
          previousProducts.map((product) =>
            product.id === data.productId
              ? { ...product, quantity: Math.max(0, product.quantity - data.quantity) }
              : product
          )
        );
      }

      return { previousProducts };
    },
    onError: (error, _, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(['products', 'stock'], context.previousProducts);
      }
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to remove stock');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products', 'stock'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock', 'movements', variables.productId] });
      toast.success('Stock removed successfully');
    },
  });
}
