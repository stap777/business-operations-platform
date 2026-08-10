import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryService } from '../deliveryService';
import type { DeliveryQueryParams, DeliveryPaymentRequest } from '../delivery.types';
import { toast } from 'sonner';

export const deliveryKeys = {
  all: ['delivery-orders'] as const,
  list: (params?: DeliveryQueryParams) => [...deliveryKeys.all, 'list', params] as const,
};

export const useAssignedDeliveries = (params: DeliveryQueryParams = {}) => {
  return useQuery({
    queryKey: deliveryKeys.list(params),
    queryFn: () => deliveryService.getAssignedOrders(params),
    staleTime: 15_000,
  });
};

export const useStartDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => deliveryService.startDelivery(orderId),
    onSuccess: (data) => {
      toast.success(`Order ${data.orderNumber} is now Out for Delivery`);
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to start delivery.';
      toast.error(msg);
    },
  });
};

export const useMarkDelivered = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: number; payload: DeliveryPaymentRequest }) =>
      deliveryService.markDelivered(orderId, payload),
    onSuccess: (data) => {
      toast.success(`Order ${data.orderNumber} marked as Delivered`);
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to mark order as delivered.';
      toast.error(msg);
    },
  });
};
