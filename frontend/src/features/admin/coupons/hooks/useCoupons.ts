import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponService } from '../couponService';
import type { CouponRequest } from '../coupon.types';
import { toast } from 'sonner';

export const couponKeys = {
  all: ['coupons'] as const,
  list: (query?: string, active?: boolean, page?: number, size?: number) =>
    [...couponKeys.all, 'list', { query, active, page, size }] as const,
  detail: (id?: number) => [...couponKeys.all, 'detail', id] as const,
};

export const useCoupons = (
  query?: string,
  active?: boolean,
  page = 0,
  size = 20
) => {
  return useQuery({
    queryKey: couponKeys.list(query, active, page, size),
    queryFn: () => couponService.searchCoupons(query, active, page, size),
    staleTime: 30_000,
  });
};

export const useCouponDetails = (id?: number) => {
  return useQuery({
    queryKey: couponKeys.detail(id),
    queryFn: () => (id ? couponService.getCouponById(id) : Promise.reject('No ID provided')),
    enabled: !!id,
    staleTime: 30_000,
  });
};

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CouponRequest) => couponService.createCoupon(data),
    onSuccess: (data) => {
      toast.success(`Coupon '${data.code}' created successfully!`);
      queryClient.invalidateQueries({ queryKey: couponKeys.all });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create coupon.';
      toast.error(msg);
    },
  });
};

export const useUpdateCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CouponRequest }) =>
      couponService.updateCoupon(id, data),
    onSuccess: (data) => {
      toast.success(`Coupon '${data.code}' updated successfully!`);
      queryClient.invalidateQueries({ queryKey: couponKeys.all });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update coupon.';
      toast.error(msg);
    },
  });
};

export const useToggleCouponStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => couponService.toggleCouponStatus(id),
    onSuccess: (data) => {
      const statusText = data.active ? 'activated' : 'deactivated';
      toast.success(`Coupon '${data.code}' ${statusText}!`);
      queryClient.invalidateQueries({ queryKey: couponKeys.all });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to toggle coupon status.';
      toast.error(msg);
    },
  });
};

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => couponService.deleteCoupon(id),
    onSuccess: () => {
      toast.success('Coupon deleted.');
      queryClient.invalidateQueries({ queryKey: couponKeys.all });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to delete coupon.';
      toast.error(msg);
    },
  });
};
