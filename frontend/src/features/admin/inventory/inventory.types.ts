import type { ProductResponse } from '../../products/product.types';

export type StockAdjustmentType = 'IN' | 'OUT' | 'DAMAGED' | 'CORRECTION';

export interface StockAdjustmentRequest {
  productId: number;
  adjustmentType: StockAdjustmentType;
  quantity: number;
  reason: string;
  referenceNumber?: string;
}

export interface StockAdjustmentResponse {
  id: number;
  productId: number;
  productName: string;
  adjustmentType: StockAdjustmentType;
  quantity: number;
  reason: string;
  referenceNumber?: string;
  adjustedById: number;
  adjustedByName: string;
  adjustmentDate: string; // ISO string
  createdAt: string;     // ISO string
}

export interface InventoryFilterParams {
  name?: string;
  categoryId?: number;
  lowStockOnly?: boolean;
  page?: number;
  size?: number;
}

export interface StockAdjustmentFilterParams {
  productId?: number;
  type?: StockAdjustmentType;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export type StockStatusType = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NOT_TRACKED';

export function deriveStockStatus(product: ProductResponse): StockStatusType {
  if (!product.trackInventory) {
    return 'NOT_TRACKED';
  }
  const stock = product.availableStock ?? 0;
  const minStock = product.minimumStock ?? 0;

  if (stock <= 0) {
    return 'OUT_OF_STOCK';
  }
  if (stock <= minStock) {
    return 'LOW_STOCK';
  }
  return 'IN_STOCK';
}
