import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../inventoryService';
import type {
  InventoryFilterParams,
  StockAdjustmentFilterParams,
  StockAdjustmentRequest,
} from '../inventory.types';
import { toast } from 'sonner';

export const inventoryKeys = {
  all: ['inventory'] as const,
  products: (params?: InventoryFilterParams) =>
    [...inventoryKeys.all, 'products', params] as const,
  adjustments: (params?: StockAdjustmentFilterParams) =>
    [...inventoryKeys.all, 'adjustments', params] as const,
};

export const useInventoryProducts = (params: InventoryFilterParams = {}) => {
  return useQuery({
    queryKey: inventoryKeys.products(params),
    queryFn: () => inventoryService.getInventoryProducts(params),
    staleTime: 15_000,
  });
};

export const useStockAdjustmentsHistory = (params: StockAdjustmentFilterParams = {}) => {
  return useQuery({
    queryKey: inventoryKeys.adjustments(params),
    queryFn: () => inventoryService.searchStockAdjustments(params),
    staleTime: 15_000,
  });
};

export const useCreateStockAdjustment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StockAdjustmentRequest) => inventoryService.createStockAdjustment(data),
    onSuccess: (data) => {
      toast.success(
        `Stock adjustment (${data.adjustmentType} ${data.quantity}) recorded for '${data.productName}'`
      );
      // Invalidate both inventory products list and stock adjustment history queries
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to process stock adjustment.';
      toast.error(msg);
    },
  });
};
