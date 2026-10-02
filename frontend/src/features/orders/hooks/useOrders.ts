import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { orderService } from '../orderService';
import type { OrderQueryParams, OrderRequest } from '../order.types';
import { toast } from 'sonner';

export const orderKeys = {
  all: ['orders'] as const,
  list: (params?: OrderQueryParams) => [...orderKeys.all, 'list', params] as const,
  detail: (id?: number) => [...orderKeys.all, 'detail', id] as const,
};

export const useOrders = (params: OrderQueryParams = {}) => {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => orderService.searchOrders(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
};

export const useOrderDetails = (id?: number | null) => {
  return useQuery({
    queryKey: orderKeys.detail(id ?? undefined),
    queryFn: () => (id ? orderService.getOrderById(id) : Promise.reject('No ID')),
    enabled: !!id,
    staleTime: 30_000,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OrderRequest) => orderService.createOrder(data),
    onSuccess: (data) => {
      toast.success(`Order ${data.orderNumber} created successfully`);
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create order.';
      toast.error(msg);
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: OrderRequest }) =>
      orderService.updateOrder(id, data),
    onSuccess: (data) => {
      toast.success(`Order ${data.orderNumber} updated successfully.`);
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update order.';
      toast.error(msg);
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => orderService.cancelOrder(id),
    onSuccess: (data) => {
      toast.success(`Order ${data.orderNumber} has been cancelled`);
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to cancel order.';
      toast.error(msg);
    },
  });
};

export const usePendingVerificationOrders = (page = 0, size = 50) => {
  return useQuery({
    queryKey: ['admin', 'orders', 'pending-verification', page, size],
    queryFn: () => orderService.getPendingVerificationOrders(page, size),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
};

export const useVerifyOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => orderService.verifyOrder(id),
    onSuccess: (invoice) => {
      toast.success(`Order #${invoice.orderNumber} verified! Invoice #${invoice.invoiceNumber} generated.`);
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', 'pending-verification'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to verify order.';
      toast.error(msg);
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => orderService.deleteOrder(id),
    onSuccess: () => {
      toast.success('Order deleted.');
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to delete order.';
      toast.error(msg);
    },
  });
};

export const useVoidOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: import('../order.types').VoidOrderRequest }) =>
      orderService.voidOrder(id, data),
    onSuccess: (data) => {
      toast.success(`Order ${data.orderNumber} has been voided.`);
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', 'pending-verification'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['customer-ledger'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to void order.';
      toast.error(msg);
    },
  });
};
