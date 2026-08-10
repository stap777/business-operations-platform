import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../productService';
import type { CategoryQueryParams, CategoryRequest } from '../product.types';
import { toast } from 'sonner';

export const CATEGORY_KEYS = {
  all: ['categories'] as const,
  list: (params?: CategoryQueryParams) => [...CATEGORY_KEYS.all, 'list', params] as const,
  detail: (id: number) => [...CATEGORY_KEYS.all, 'detail', id] as const,
  dropdown: () => [...CATEGORY_KEYS.all, 'dropdown'] as const,
};

export const useCategories = (params?: CategoryQueryParams) => {
  return useQuery({
    queryKey: CATEGORY_KEYS.list(params),
    queryFn: () => productService.getCategories(params),
  });
};

export const useCategoryDropdown = () => {
  return useQuery({
    queryKey: CATEGORY_KEYS.dropdown(),
    queryFn: () => productService.getCategoryDropdown(),
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CategoryRequest) => productService.createCategory(data),
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      toast.success(`Category "${newCat.name}" created successfully!`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to create category. Please try again.';
      toast.error(message);
    },
  });
};

export const useDeactivateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => productService.deactivateCategory(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      toast.success(`Category "${updated.name}" deactivated.`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to deactivate category.';
      toast.error(message);
    },
  });
};
