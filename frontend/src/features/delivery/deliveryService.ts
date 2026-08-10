import { apiClient } from '../../api/apiClient';
import type {
  DeliveryOrderResponse,
  DeliveryPageResponse,
  DeliveryPaymentRequest,
  DeliveryQueryParams,
} from './delivery.types';

export const deliveryService = {
  /**
   * Fetch orders assigned to the logged-in delivery person (backend principal scoped)
   */
  getAssignedOrders: async (params: DeliveryQueryParams = {}): Promise<DeliveryPageResponse> => {
    const { page = 0, size = 50 } = params;
    const response = await apiClient.get<DeliveryPageResponse>('/delivery/orders', {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Transition assigned order from ASSIGNED -> OUT_FOR_DELIVERY
   */
  startDelivery: async (orderId: number): Promise<DeliveryOrderResponse> => {
    const response = await apiClient.patch<DeliveryOrderResponse>(
      `/delivery/orders/${orderId}/start-delivery`
    );
    return response.data;
  },

  /**
   * Transition order from OUT_FOR_DELIVERY -> DELIVERED with payment collection details
   */
  markDelivered: async (
    orderId: number,
    payload: DeliveryPaymentRequest
  ): Promise<DeliveryOrderResponse> => {
    const response = await apiClient.patch<DeliveryOrderResponse>(
      `/delivery/orders/${orderId}/mark-delivered`,
      payload
    );
    return response.data;
  },
};
