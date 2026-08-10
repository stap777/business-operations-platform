import { apiClient } from '../../../api/apiClient';
import type { ProductPageResponse } from '../../products/product.types';
import type {
  StockAdjustmentRequest,
  StockAdjustmentResponse,
  InventoryFilterParams,
  StockAdjustmentFilterParams,
} from './inventory.types';

export const inventoryService = {
  getInventoryProducts: async (
    params: InventoryFilterParams = {}
  ): Promise<ProductPageResponse> => {
    const { name, categoryId, lowStockOnly, page = 0, size = 20 } = params;
    const queryParams: Record<string, any> = { page, size };

    if (name && name.trim() !== '') {
      queryParams.name = name.trim();
    }
    if (categoryId) {
      queryParams.categoryId = categoryId;
    }
    if (lowStockOnly) {
      queryParams.lowStockOnly = true;
    }

    const response = await apiClient.get<ProductPageResponse>('/products/search', {
      params: queryParams,
    });
    return response.data;
  },

  createStockAdjustment: async (
    data: StockAdjustmentRequest
  ): Promise<StockAdjustmentResponse> => {
    const response = await apiClient.post<StockAdjustmentResponse>('/stock-adjustments', data);
    return response.data;
  },

  searchStockAdjustments: async (
    params: StockAdjustmentFilterParams = {}
  ): Promise<{
    content: StockAdjustmentResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> => {
    const { productId, type, startDate, endDate, page = 0, size = 20 } = params;
    const queryParams: Record<string, any> = { page, size };

    if (productId) queryParams.productId = productId;
    if (type) queryParams.type = type;
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;

    const response = await apiClient.get('/stock-adjustments/search', {
      params: queryParams,
    });
    return response.data;
  },

  getStockAdjustmentById: async (id: number): Promise<StockAdjustmentResponse> => {
    const response = await apiClient.get<StockAdjustmentResponse>(`/stock-adjustments/${id}`);
    return response.data;
  },
};
