import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface CheckoutPayload {
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'pix';
  customerName?: string;
  customerId?: string;
  discount?: number;
  tax?: number;
  total: number;
  amountReceived?: number;
}

export interface CheckoutResponse {
  saleId: string;
  receiptNumber: string;
  subtotal?: number;
  discount?: number;
  tax?: number;
  total: number;
  change?: number;
  createdAt: string;
  paymentMethod?: string;
  customerName?: string;
  customerId?: string;
}

// Checkout mutation
export function useCheckout() {
  return useMutation({
    mutationFn: async (payload: CheckoutPayload) => {
      const response = await api.post('/pos/checkout', payload);
      return response.data as CheckoutResponse;
    },
    onSuccess: () => {
      toast.success('Sale completed successfully');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Checkout failed');
    },
  });
}

// Quick sale (for testing or simplified checkout)
export function useQuickSale() {
  return useMutation({
    mutationFn: async (payload: CheckoutPayload) => {
      const response = await api.post('/pos/quick-sale', payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Quick sale completed');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Quick sale failed');
    },
  });
}
