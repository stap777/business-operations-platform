import axios, { AxiosError } from 'axios';
import { parseApiError } from './apiError';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Authorization Bearer header fallback if stored in localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('aven_session_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle 401 Unauthorized globally and normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const normalizedError = parseApiError(error);
    (error as AxiosError & { apiError?: typeof normalizedError }).apiError = normalizedError;

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('aven_session_token');
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

