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

  // Token Refresh Architecture Placeholder (Sprint 10 expansion)
  refreshToken: async (): Promise<string> => {
    // Placeholder architecture for silent token refresh via HTTP-only cookie or refresh endpoint
    const response = await apiClient.post<{ token: string }>('/auth/refresh-token');
    return response.data.token;
  },
};
