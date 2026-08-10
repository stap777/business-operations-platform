import { apiClient } from '../api/apiClient';
import type { Customer, Page } from '../types';

export const customerService = {
  getCustomers: async (page = 0, size = 20, query?: string): Promise<Page<Customer>> => {
    const response = await apiClient.get<Page<Customer>>('/customers', {
      params: { page, size, query },
    });
    return response.data;
  },

  getCustomerById: async (id: number): Promise<Customer> => {
    const response = await apiClient.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  createCustomer: async (customerData: Partial<Customer>): Promise<Customer> => {
    const response = await apiClient.post<Customer>('/customers', customerData);
    return response.data;
  },

  updateCustomer: async (id: number, customerData: Partial<Customer>): Promise<Customer> => {
    const response = await apiClient.put<Customer>(`/customers/${id}`, customerData);
    return response.data;
  },
};
