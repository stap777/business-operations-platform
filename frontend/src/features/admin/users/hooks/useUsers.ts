import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../userService';
import type { UserQueryParams, CreateUserRequest, UpdateUserRequest, ResetPasswordRequest } from '../user.types';
import { toast } from 'sonner';

export const USER_KEYS = {
  all: ['admin-users'] as const,
  list: (params?: UserQueryParams) => [...USER_KEYS.all, 'list', params] as const,
  detail: (id: number) => [...USER_KEYS.all, 'detail', id] as const,
};

export const useUsers = (params?: UserQueryParams) => {
  return useQuery({
    queryKey: USER_KEYS.list(params),
    queryFn: () => userService.getUsers(params),
  });
};

export const useUserDetails = (id: number | null) => {
  return useQuery({
    queryKey: id ? USER_KEYS.detail(id) : ['admin-users', 'detail', 'null'],
    queryFn: () => (id ? userService.getUserById(id) : Promise.reject('No ID provided')),
    enabled: !!id,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, role }: { data: CreateUserRequest; role: 'MANAGER' | 'DELIVERY' }) => {
      if (role === 'MANAGER') {
        return userService.createManager(data);
      }
      return userService.createDeliveryUser(data);
    },
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      toast.success(`${newUser.role} account "${newUser.fullName}" created successfully!`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to create employee account.';
      toast.error(message);
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) =>
      userService.updateUser(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      toast.success(`Profile for "${updated.fullName}" updated successfully.`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to update employee profile.';
      toast.error(message);
    },
  });
};

export const useActivateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => userService.activateUser(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      toast.success(`Account for "${updated.fullName}" has been activated.`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to activate employee account.';
      toast.error(message);
    },
  });
};

export const useDeactivateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => userService.deactivateUser(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      toast.success(`Account for "${updated.fullName}" has been deactivated.`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to deactivate employee account.';
      toast.error(message);
    },
  });
};

export const useResetEmployeePassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ResetPasswordRequest }) =>
      userService.resetPassword(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      toast.success(`Password for "${updated.fullName}" reset successfully.`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to reset employee password.';
      toast.error(message);
    },
  });
};
