import { AxiosError } from 'axios';

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  validationErrors?: Record<string, string>;
  referenceId?: string;
}

export function parseApiError(error: unknown): ApiError {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<{
      status?: number;
      message?: string;
      error?: string;
      validationErrors?: Record<string, string>;
      code?: string;
      referenceId?: string;
    }>;

    const response = axiosError.response;

    if (response) {
      const data = response.data;
      return {
        status: response.status,
        message:
          data?.message ||
          data?.error ||
          getHttpStatusDefaultMessage(response.status),
        code: data?.code || `HTTP_${response.status}`,
        validationErrors: data?.validationErrors,
        referenceId: data?.referenceId,
      };
    }

    if (axiosError.request) {
      return {
        status: 0,
        message: 'Unable to connect to the server. Please check your network connection.',
        code: 'NETWORK_ERROR',
      };
    }
  }

  if (error instanceof Error) {
    return {
      status: 500,
      message: error.message,
      code: 'GENERIC_ERROR',
    };
  }

  return {
    status: 500,
    message: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
  };
}

function getHttpStatusDefaultMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Bad request. Please verify input data.';
    case 401:
      return 'Session expired. Please log in again.';
    case 403:
      return 'Access denied. You do not have permission to perform this action.';
    case 404:
      return 'Requested resource not found.';
    case 409:
      return 'Business conflict detected. Please refresh and try again.';
    case 422:
      return 'Unprocessable input entity.';
    case 429:
      return 'Too many requests. Please slow down.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable.';
    default:
      return `HTTP error ${status} occurred.`;
  }
}
