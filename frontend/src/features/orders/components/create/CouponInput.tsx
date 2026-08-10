import React, { useState } from 'react';
import { couponService } from '../../../admin/coupons/couponService';
import type { CouponResponse } from '../../../admin/coupons/coupon.types';
import { Button } from '../../../../components/ui/button';
import { Tag, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface CouponInputProps {
  subtotal: number;
  appliedCoupon: CouponResponse | null;
  onApplyCoupon: (coupon: CouponResponse | null, discountCalculated: number) => void;
}

export const CouponInput: React.FC<CouponInputProps> = ({
  subtotal,
  appliedCoupon,
  onApplyCoupon,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsLoading(true);
    try {
      const coupon = await couponService.getCouponByCode(couponCode.trim());

      // Validate minimum order amount
      if (coupon.minimumOrderAmount && subtotal < coupon.minimumOrderAmount) {
        toast.error(`Minimum order subtotal of ₹${coupon.minimumOrderAmount} required for coupon '${coupon.code}'.`);
        setIsLoading(false);
        return;
      }

      // Calculate discount value
      let discount = 0;
      if (coupon.discountType === 'PERCENTAGE') {
        discount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
          discount = coupon.maximumDiscount;
        }
      } else {
        // FLAT
        discount = coupon.discountValue;
      }

      discount = Math.min(discount, subtotal);
      onApplyCoupon(coupon, discount);
      toast.success(`Coupon '${coupon.code}' applied! Discount: ₹${discount.toFixed(2)}`);
      setCouponCode('');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || `Coupon '${couponCode}' is invalid or expired.`;
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    onApplyCoupon(null, 0);
    toast.info('Coupon removed.');
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA] block">
        Coupon <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal">(Optional)</span>
      </label>

      {appliedCoupon ? (
        <div className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <Tag className="w-4 h-4" />
            <span className="font-mono font-bold uppercase">{appliedCoupon.code}</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
              ({appliedCoupon.discountType === 'PERCENTAGE' ? `${appliedCoupon.discountValue}% OFF` : `₹${appliedCoupon.discountValue} OFF`})
            </span>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="p-1 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="flex items-center gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code..."
            className="flex-1 px-3 py-2 text-xs bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl text-[#111111] dark:text-[#FAFAFA] font-mono placeholder-[#71717A] uppercase focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
          />
          <Button
            type="submit"
            disabled={isLoading || !couponCode.trim() || subtotal === 0}
            variant="outline"
            size="sm"
            className="h-9 px-4 text-xs font-medium border-[#ECECEC] dark:border-[#232323]"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
          </Button>
        </form>
      )}
    </div>
  );
};
