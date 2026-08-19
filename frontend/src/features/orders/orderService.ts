import { apiClient } from '../../api/apiClient';
import type {
  OrderPageResponse,
  OrderResponse,
  OrderRequest,
  OrderQueryParams,
  InvoiceResponse,
} from './order.types';

export const orderService = {
  searchOrders: async (params: OrderQueryParams = {}): Promise<OrderPageResponse> => {
    const { orderNumber, customerId, status, startDate, endDate, page = 0, size = 20 } = params;
    const queryParams: Record<string, any> = { page, size };

    if (orderNumber && orderNumber.trim() !== '') {
      queryParams.orderNumber = orderNumber.trim();
    }
    if (customerId) queryParams.customerId = customerId;
    if (status) queryParams.status = status;
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;

    const response = await apiClient.get<OrderPageResponse>('/orders/search', {
      params: queryParams,
    });
    return response.data;
  },

  getOrderById: async (id: number): Promise<OrderResponse> => {
    const response = await apiClient.get<OrderResponse>(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (data: OrderRequest): Promise<OrderResponse> => {
    const response = await apiClient.post<OrderResponse>('/orders', data);
    return response.data;
  },

  cancelOrder: async (id: number): Promise<OrderResponse> => {
    const response = await apiClient.patch<OrderResponse>(`/orders/${id}/cancel`);
    return response.data;
  },

  /**
   * Admin order verification endpoint: POST /admin/orders/{id}/verify
   * Triggers atomic backend verification:
   * - Validates DELIVERED status
   * - Deducts stock & creates StockAdjustment log
   * - Increments coupon usage
   * - Creates AuditLog
   * - Generates Invoice and updates OrderStatus to VERIFIED
   */
  verifyOrder: async (orderId: number): Promise<InvoiceResponse> => {
    const response = await apiClient.post<InvoiceResponse>(`/admin/orders/${orderId}/verify`);
    return response.data;
  },

  /**
   * Fetch delivered orders awaiting admin verification: GET /admin/orders/pending-verification
   */
  getPendingVerificationOrders: async (page = 0, size = 50) => {
    const response = await apiClient.get<OrderPageResponse>('/admin/orders/pending-verification', {
      params: { page, size },
    });
    return response.data;
  },
};
