import { apiClient } from '../api/apiClient';
import type { AuthResponse, User } from '../types';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SetupAdminRequest {
  fullName: string;
  username: string;
  password: string;
}

export interface SystemStatusResponse {
  adminExists: boolean;
  systemInitialized: boolean;
}

export const authService = {
  // Authentication endpoint
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  // Logout current session
  logout: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/logout');
    return response.data;
  },

  // Logout all sessions across devices
  logoutAll: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/logout-all');
    return response.data;
  },

  // Get Current Authenticated User profile
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  // First-Time System Setup: Check if an Admin exists
  checkSystemStatus: async (): Promise<SystemStatusResponse> => {
    const response = await apiClient.get<SystemStatusResponse>('/auth/status');
    return response.data;
  },

  // First-Time System Setup: Create Initial Admin
  setupFirstAdmin: async (request: SetupAdminRequest): Promise<User> => {
    const response = await apiClient.post<User>('/auth/setup-admin', request);
    return response.data;
  },

  // Password Recovery: Request Password Reset Link
  forgotPassword: async (emailOrUsername: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/forgot-password', {
      emailOrUsername,
    });
    return response.data;
  },

  // Password Recovery: Reset Password using Token
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },
};

