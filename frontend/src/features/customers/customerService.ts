import { apiClient } from '../../api/apiClient';
import type {
  CustomerPageResponse,
  CustomerRequest,
  CustomerResponse,
  CustomerQueryParams,
  PendingOrderResponse,
  CustomerLedgerResponse,
} from './customer.types';

export const customerService = {
  getCustomers: async (params?: CustomerQueryParams): Promise<CustomerPageResponse> => {
    const response = await apiClient.get<CustomerPageResponse>('/customers/search', {
      params: {
        query: params?.query?.trim() || undefined,
        page: params?.page ?? 0,
        size: params?.size ?? 20,
      },
    });
    return response.data;
  },

  getCustomerById: async (id: number): Promise<CustomerResponse> => {
    const response = await apiClient.get<CustomerResponse>(`/customers/${id}`);
    return response.data;
  },

  createCustomer: async (data: CustomerRequest): Promise<CustomerResponse> => {
    const response = await apiClient.post<CustomerResponse>('/customers', data);
    return response.data;
  },

  getPendingOrders: async (customerId: number): Promise<PendingOrderResponse[]> => {
    const response = await apiClient.get<PendingOrderResponse[]>(`/customers/${customerId}/pending-orders`);
    return response.data;
  },

  getCustomerLedger: async (customerId: number): Promise<CustomerLedgerResponse> => {
    const response = await apiClient.get<CustomerLedgerResponse>(`/reports/customer-ledger/${customerId}`);
    return response.data;
  },
};
