import { apiClient } from '../../../api/apiClient';
import type {
  PaymentRequest,
  PaymentResponse,
  PaymentFilterParams,
} from './payment.types';
import type { OrderResponse } from '../../orders/order.types';
import type { PageResponse } from '../../dashboard/dashboard.types';

export const paymentService = {
  /**
   * Search orders for credit/receivables tracking: GET /orders/search
   */
  searchCreditOrders: async (params: PaymentFilterParams = {}): Promise<PageResponse<OrderResponse>> => {
    const queryParams: Record<string, any> = {
      page: params.page ?? 0,
      size: params.size ?? 20,
    };

    if (params.orderNumber) queryParams.orderNumber = params.orderNumber;
    if (params.customerId) queryParams.customerId = params.customerId;
    if (params.orderStatus) queryParams.status = params.orderStatus;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;

    const response = await apiClient.get<PageResponse<OrderResponse>>('/orders/search', {
      params: queryParams,
    });
    return response.data;
  },

  /**
   * Post a new payment transaction & allocation: POST /payments
   */
  recordPayment: async (payload: PaymentRequest): Promise<PaymentResponse> => {
    const response = await apiClient.post<PaymentResponse>('/payments', payload);
    return response.data;
  },

  /**
   * Fetch payment transaction details by ID: GET /payments/{id}
   */
  getPaymentById: async (id: number): Promise<PaymentResponse> => {
    const response = await apiClient.get<PaymentResponse>(`/payments/${id}`);
    return response.data;
  },

  /**
   * Search payment transactions log: GET /payments/search
   */
  searchPayments: async (params: Record<string, any> = {}): Promise<PageResponse<PaymentResponse>> => {
    const response = await apiClient.get<PageResponse<PaymentResponse>>('/payments/search', {
      params,
    });
    return response.data;
  },

  /**
   * Suggest FIFO allocations across customer's outstanding orders: GET /payments/suggest
   */
  suggestAllocations: async (customerId: number, amount: number) => {
    const response = await apiClient.get('/payments/suggest', {
      params: { customerId, amount },
    });
    return response.data;
  },
};
