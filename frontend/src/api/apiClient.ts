import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { parseApiError } from './apiError';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer token if present
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token =
      localStorage.getItem('bms_jwt_token') || sessionStorage.getItem('bms_jwt_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized globally and normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const normalizedError = parseApiError(error);
    (error as AxiosError & { apiError?: typeof normalizedError }).apiError = normalizedError;

    if (error.response && error.response.status === 401) {
      // Clear session from both storages on 401 Unauthorized
      localStorage.removeItem('bms_jwt_token');
      localStorage.removeItem('bms_user_info');
      sessionStorage.removeItem('bms_jwt_token');
      sessionStorage.removeItem('bms_user_info');

      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/setup')
      ) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);
