import { apiClient } from '../../../api/apiClient';
import type {
  UserQueryParams,
  UserPageResponse,
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  ResetPasswordRequest,
} from './user.types';

export const userService = {
  getUsers: async (params?: UserQueryParams): Promise<UserPageResponse> => {
    const response = await apiClient.get<UserPageResponse>('/admin/users/search', {
      params: {
        query: params?.query?.trim() || undefined,
        role: params?.role || undefined,
        status: params?.status || undefined,
        page: params?.page ?? 0,
        size: params?.size ?? 20,
      },
    });
    return response.data;
  },

  getUserById: async (id: number): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>(`/admin/users/${id}`);
    return response.data;
  },

  createManager: async (data: CreateUserRequest): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>('/admin/users/manager', data);
    return response.data;
  },

  createDeliveryUser: async (data: CreateUserRequest): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>('/admin/users/delivery', data);
    return response.data;
  },

  updateUser: async (id: number, data: UpdateUserRequest): Promise<UserResponse> => {
    const response = await apiClient.put<UserResponse>(`/admin/users/${id}`, data);
    return response.data;
  },

  activateUser: async (id: number): Promise<UserResponse> => {
    const response = await apiClient.patch<UserResponse>(`/admin/users/${id}/activate`);
    return response.data;
  },

  deactivateUser: async (id: number): Promise<UserResponse> => {
    const response = await apiClient.patch<UserResponse>(`/admin/users/${id}/deactivate`);
    return response.data;
  },

  resetPassword: async (id: number, data: ResetPasswordRequest): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>(`/admin/users/${id}/reset-password`, data);
    return response.data;
  },
};
