import { apiClient } from '../../../api/apiClient';
import type { CouponResponse, CouponRequest, PageResponse } from './coupon.types';

export const couponService = {
  searchCoupons: async (query?: string, active?: boolean, page = 0, size = 20): Promise<PageResponse<CouponResponse>> => {
    const response = await apiClient.get<PageResponse<CouponResponse>>('/coupons/search', {
      params: { query, active, page, size },
    });
    return response.data;
  },

  getCouponById: async (id: number): Promise<CouponResponse> => {
    const response = await apiClient.get<CouponResponse>(`/coupons/${id}`);
    return response.data;
  },

  getCouponByCode: async (code: string): Promise<CouponResponse> => {
    const response = await apiClient.get<CouponResponse>(`/coupons/code/${encodeURIComponent(code.trim().toUpperCase())}`);
    return response.data;
  },

  createCoupon: async (data: CouponRequest): Promise<CouponResponse> => {
    const response = await apiClient.post<CouponResponse>('/coupons', data);
    return response.data;
  },

  updateCoupon: async (id: number, data: CouponRequest): Promise<CouponResponse> => {
    const response = await apiClient.put<CouponResponse>(`/coupons/${id}`, data);
    return response.data;
  },

  toggleCouponStatus: async (id: number): Promise<CouponResponse> => {
    const response = await apiClient.patch<CouponResponse>(`/coupons/${id}/toggle-status`);
    return response.data;
  },
};
