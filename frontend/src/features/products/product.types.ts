export type ProductUnit = 'BARREL' | 'BOTTLE' | 'BOX' | 'PCS';
export type ProductStatus = 'ACTIVE' | 'INACTIVE';
export type CategoryStatus = 'ACTIVE' | 'INACTIVE';

export interface ProductResponse {
  id: number;
  sku: string;
  name: string;
  categoryId: number;
  categoryName: string;
  purchasePrice: number;
  sellingPrice: number;
  availableStock: number;
  minimumStock: number;
  unit: ProductUnit;
  trackInventory: boolean;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequest {
  name: string;
  categoryId: number;
  purchasePrice: number;
  sellingPrice: number;
  availableStock: number;
  minimumStock: number;
  unit: ProductUnit;
  trackInventory: boolean;
}

export interface ProductQueryParams {
  name?: string;
  categoryId?: number;
  lowStockOnly?: boolean;
  page?: number;
  size?: number;
}

export interface ProductPageResponse {
  content: ProductResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ProductDropdownResponse {
  id: number;
  name: string;
  sellingPrice: number;
  availableStock: number;
  unit: ProductUnit;
}

export interface CategoryResponse {
  id: number;
  name: string;
  description?: string;
  status: CategoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRequest {
  name: string;
  description?: string;
}

export interface CategoryQueryParams {
  query?: string;
  page?: number;
  size?: number;
}

export interface CategoryPageResponse {
  content: CategoryResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface CategoryDropdownResponse {
  id: number;
  name: string;
}
