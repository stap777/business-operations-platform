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

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CustomerRequest }) =>
      customerService.updateCustomer(id, data),
    onSuccess: (updated) => {
      toast.success('Customer Updated', {
        description: `${updated.fullName} (${updated.customerCode}) has been updated.`,
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', updated.id] });
    },
    onError: (error: unknown) => {
      let message = 'Failed to update customer.';
      if (error instanceof AxiosError && error.response?.data?.message) {
        message = error.response.data.message;
      }
      toast.error('Update Failed', {
        description: message,
      });
    },
  });
};

export const useDeactivateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => customerService.deactivateCustomer(id),
    onSuccess: (updated) => {
      toast.success('Customer Deactivated', {
        description: `${updated.fullName} is now INACTIVE.`,
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: unknown) => {
      let message = 'Failed to deactivate customer.';
      if (error instanceof AxiosError && error.response?.data?.message) {
        message = error.response.data.message;
      }
      toast.error('Deactivation Failed', {
        description: message,
      });
    },
  });
};

export const useRestoreCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => customerService.restoreCustomer(id),
    onSuccess: (updated) => {
      toast.success('Customer Restored', {
        description: `${updated.fullName} is now ACTIVE.`,
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: unknown) => {
      let message = 'Failed to restore customer.';
      if (error instanceof AxiosError && error.response?.data?.message) {
        message = error.response.data.message;
      }
      toast.error('Restore Failed', {
        description: message,
      });
    },
  });
};
