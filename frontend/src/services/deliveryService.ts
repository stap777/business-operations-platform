import { apiClient } from '../api/apiClient';

export interface DeliveryPersonResponse {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: string;
}

export interface UserPageResponse {
  content: DeliveryPersonResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export const deliveryService = {
  getDeliveryPeople: async (): Promise<DeliveryPersonResponse[]> => {
    const response = await apiClient.get<UserPageResponse>('/admin/users/search', {
      params: {
        role: 'DELIVERY',
        status: 'ACTIVE',
        page: 0,
        size: 100,
      },
    });
    return response.data.content || [];
  },
};
