import { apiClient } from '../api/apiClient';
import type { Order, Page } from '../types';

export const orderService = {
  getOrders: async (page = 0, size = 20, status?: string): Promise<Page<Order>> => {
    const response = await apiClient.get<Page<Order>>('/orders', {
      params: { page, size, status },
    });
    return response.data;
  },

  getOrderById: async (id: number): Promise<Order> => {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (orderData: Partial<Order>): Promise<Order> => {
    const response = await apiClient.post<Order>('/orders', orderData);
    return response.data;
  },
};
