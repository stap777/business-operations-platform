import { apiClient } from '../api/apiClient';
import type { Page, Product } from '../types';

export const productService = {
  getProducts: async (page = 0, size = 20, query?: string): Promise<Page<Product>> => {
    const response = await apiClient.get<Page<Product>>('/products', {
      params: { page, size, query },
    });
    return response.data;
  },

  getProductById: async (id: number): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  createProduct: async (productData: Partial<Product>): Promise<Product> => {
    const response = await apiClient.post<Product>('/products', productData);
    return response.data;
  },

  updateProduct: async (id: number, productData: Partial<Product>): Promise<Product> => {
    const response = await apiClient.put<Product>(`/products/${id}`, productData);
    return response.data;
  },
};
