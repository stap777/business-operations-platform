import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../productService';
import type { ProductQueryParams, ProductRequest } from '../product.types';
import { toast } from 'sonner';

export const PRODUCT_KEYS = {
  all: ['products'] as const,
  list: (params?: ProductQueryParams) => [...PRODUCT_KEYS.all, 'list', params] as const,
  detail: (id: number) => [...PRODUCT_KEYS.all, 'detail', id] as const,
  dropdown: () => [...PRODUCT_KEYS.all, 'dropdown'] as const,
};

export const useProducts = (params?: ProductQueryParams) => {
  return useQuery({
    queryKey: PRODUCT_KEYS.list(params),
    queryFn: () => productService.getProducts(params),
  });
};

export const useProductDetails = (id: number | null) => {
  return useQuery({
    queryKey: id ? PRODUCT_KEYS.detail(id) : ['products', 'detail', 'null'],
    queryFn: () => (id ? productService.getProductById(id) : Promise.reject('No ID provided')),
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductRequest) => productService.createProduct(data),
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      toast.success(`Product "${newProduct.name}" created successfully!`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to create product. Please try again.';
      toast.error(message);
    },
  });
};

export const useDeactivateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => productService.deactivateProduct(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      toast.success(`Product "${updated.name}" deactivated.`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to deactivate product.';
      toast.error(message);
    },
  });
};
