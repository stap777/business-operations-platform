import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '../paymentService';
import type { PaymentFilterParams, PaymentRequest } from '../payment.types';

export const paymentKeys = {
  all: ['payments'] as const,
  creditOrders: (params?: PaymentFilterParams) => [...paymentKeys.all, 'creditOrders', params] as const,
  history: (params?: Record<string, any>) => [...paymentKeys.all, 'history', params] as const,
  details: (id?: number) => [...paymentKeys.all, 'detail', id] as const,
};

export const useCreditOrders = (params: PaymentFilterParams = {}) => {
  return useQuery({
    queryKey: paymentKeys.creditOrders(params),
    queryFn: () => paymentService.searchCreditOrders(params),
    staleTime: 30 * 1000,
  });
};

export const useRecordPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PaymentRequest) => paymentService.recordPayment(payload),
    onSuccess: () => {
      // Invalidate relevant query keys after successful payment recording
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-pending-orders'] });
      queryClient.invalidateQueries({ queryKey: ['customer-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const usePaymentHistory = (customerId?: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: paymentKeys.history({ customerId }),
    queryFn: () => paymentService.searchPayments({ customerId, page: 0, size: 20 }),
    enabled: !!customerId && enabled,
    staleTime: 60 * 1000,
  });
};

export const usePaymentSuggestion = (customerId?: number, amount?: number, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['payments', 'suggest', customerId, amount],
    queryFn: () => paymentService.suggestAllocations(customerId!, amount!),
    enabled: !!customerId && amount !== undefined && amount > 0 && enabled,
    staleTime: 5 * 1000,
  });
};
