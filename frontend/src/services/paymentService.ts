import { apiClient } from '../api/apiClient';
import type { Page, Payment } from '../types';

export const paymentService = {
  getPayments: async (page = 0, size = 20): Promise<Page<Payment>> => {
    const response = await apiClient.get<Page<Payment>>('/payments', {
      params: { page, size },
    });
    return response.data;
  },

  getPaymentById: async (id: number): Promise<Payment> => {
    const response = await apiClient.get<Payment>(`/payments/${id}`);
    return response.data;
  },

  createPayment: async (paymentData: Partial<Payment>): Promise<Payment> => {
    const response = await apiClient.post<Payment>('/payments', paymentData);
    return response.data;
  },
};
