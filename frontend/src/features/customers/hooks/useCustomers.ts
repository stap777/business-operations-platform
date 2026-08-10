import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../customerService';
import type { CustomerQueryParams, CustomerRequest } from '../customer.types';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

export const useCustomers = (params: CustomerQueryParams) => {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => customerService.getCustomers(params),
    staleTime: 30 * 1000,
  });
};

export const useCustomerDetails = (id: number | null) => {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.getCustomerById(id!),
    enabled: id !== null && id > 0,
  });
};

export const useCustomerPendingOrders = (id: number | null) => {
  return useQuery({
    queryKey: ['customer-pending-orders', id],
    queryFn: () => customerService.getPendingOrders(id!),
    enabled: id !== null && id > 0,
  });
};

export const useCustomerLedger = (id: number | null) => {
  return useQuery({
    queryKey: ['customer-ledger', id],
    queryFn: () => customerService.getCustomerLedger(id!),
    enabled: id !== null && id > 0,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CustomerRequest) => customerService.createCustomer(data),
    onSuccess: (newCustomer) => {
      toast.success('Customer Added Successfully', {
        description: `${newCustomer.fullName} (${newCustomer.customerCode}) has been created.`,
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: unknown) => {
      let message = 'Failed to create customer.';
      if (error instanceof AxiosError && error.response?.data?.message) {
        message = error.response.data.message;
      }
      toast.error('Customer Creation Failed', {
        description: message,
      });
    },
  });
};
