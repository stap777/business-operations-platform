export type DiscountType = 'FLAT' | 'PERCENTAGE';

export interface CouponRequest {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscount?: number;
  startDate: string; // ISO string: YYYY-MM-DDTHH:mm:ss
  endDate: string;   // ISO string: YYYY-MM-DDTHH:mm:ss
  usageLimit: number;
  active?: boolean;
}

export interface CouponResponse {
  id: number;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface CouponValidationResponse {
  valid: boolean;
  message: string;
  coupon?: CouponResponse;
  calculatedDiscount: number;
}
