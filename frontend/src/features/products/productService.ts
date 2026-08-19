import { apiClient } from '../../api/apiClient';
import type {
  ProductPageResponse,
  ProductRequest,
  ProductResponse,
  ProductQueryParams,
  ProductDropdownResponse,
  CategoryPageResponse,
  CategoryRequest,
  CategoryResponse,
  CategoryQueryParams,
  CategoryDropdownResponse,
} from './product.types';

export const productService = {
  // Products Endpoints
  getProducts: async (params?: ProductQueryParams): Promise<ProductPageResponse> => {
    const response = await apiClient.get<ProductPageResponse>('/products/search', {
      params: {
        name: params?.name?.trim() || undefined,
        categoryId: params?.categoryId || undefined,
        lowStockOnly: params?.lowStockOnly ? true : undefined,
        page: params?.page ?? 0,
        size: params?.size ?? 20,
      },
    });
    return response.data;
  },

  getProductById: async (id: number): Promise<ProductResponse> => {
    const response = await apiClient.get<ProductResponse>(`/products/${id}`);
    return response.data;
  },

  createProduct: async (data: ProductRequest): Promise<ProductResponse> => {
    const response = await apiClient.post<ProductResponse>('/products', data);
    return response.data;
  },

  updateProduct: async (id: number, data: ProductRequest): Promise<ProductResponse> => {
    const response = await apiClient.put<ProductResponse>(`/products/${id}`, data);
    return response.data;
  },

  deactivateProduct: async (id: number): Promise<ProductResponse> => {
    const response = await apiClient.patch<ProductResponse>(`/products/${id}/deactivate`);
    return response.data;
  },

  updateStock: async (id: number, availableStock: number): Promise<ProductResponse> => {
    const response = await apiClient.patch<ProductResponse>(`/products/${id}/update-stock`, {
      availableStock,
    });
    return response.data;
  },

  getProductDropdown: async (): Promise<ProductDropdownResponse[]> => {
    const response = await apiClient.get<ProductDropdownResponse[]>('/products/dropdown');
    return response.data;
  },

  // Categories Endpoints
  getCategories: async (params?: CategoryQueryParams): Promise<CategoryPageResponse> => {
    const response = await apiClient.get<CategoryPageResponse>('/categories/search', {
      params: {
        query: params?.query?.trim() || undefined,
        page: params?.page ?? 0,
        size: params?.size ?? 20,
      },
    });
    return response.data;
  },

  getCategoryById: async (id: number): Promise<CategoryResponse> => {
    const response = await apiClient.get<CategoryResponse>(`/categories/${id}`);
    return response.data;
  },

  createCategory: async (data: CategoryRequest): Promise<CategoryResponse> => {
    const response = await apiClient.post<CategoryResponse>('/categories', data);
    return response.data;
  },

  updateCategory: async (id: number, data: CategoryRequest): Promise<CategoryResponse> => {
    const response = await apiClient.put<CategoryResponse>(`/categories/${id}`, data);
    return response.data;
  },

  deactivateCategory: async (id: number): Promise<CategoryResponse> => {
    const response = await apiClient.patch<CategoryResponse>(`/categories/${id}/deactivate`);
    return response.data;
  },

  getCategoryDropdown: async (): Promise<CategoryDropdownResponse[]> => {
    const response = await apiClient.get<CategoryDropdownResponse[]>('/categories/dropdown');
    return response.data;
  },
};
