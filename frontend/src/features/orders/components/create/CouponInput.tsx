import React, { useState, useRef, useEffect } from 'react';
import { couponService } from '../../../admin/coupons/couponService';
import { useCoupons } from '../../../admin/coupons/hooks/useCoupons';
import type { CouponResponse } from '../../../admin/coupons/coupon.types';
import { Button } from '../../../../components/ui/button';
import { Tag, Loader2, X, Search, Check, Sparkles } from 'lucide-react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch active coupons for dropdown search
  const { data: couponsPage, isLoading: isFetchingCoupons } = useCoupons(couponCode, true, 0, 10);
  const activeCoupons = couponsPage?.content || [];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const applySelectedCouponCode = async (code: string) => {
    if (!code.trim()) return;

    setIsLoading(true);
    try {
      // Execute backend coupon validation via POST /api/v1/coupons/validate
      const result = await couponService.validateCoupon(code.trim(), subtotal);

      if (!result.valid || !result.coupon) {
        toast.error(result.message || `Coupon '${code}' is invalid or expired.`);
        return;
      }

      onApplyCoupon(result.coupon, result.calculatedDiscount);
      toast.success(result.message || `Coupon '${result.coupon.code}' applied! Discount: ₹${result.calculatedDiscount.toFixed(2)}`);
      setCouponCode('');
      setIsDropdownOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || `Failed to validate coupon '${code}'.`;
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    applySelectedCouponCode(couponCode);
  };

  const handleRemove = () => {
    onApplyCoupon(null, 0);
    toast.info('Coupon removed.');
  };

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <label className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA] block">
        Coupon <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal">(Optional)</span>
      </label>

      {appliedCoupon ? (
        <div className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between text-xs animate-in fade-in duration-150">
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
            className="p-1 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
            title="Remove Coupon"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <form onSubmit={handleApply} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={couponCode}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setIsDropdownOpen(true);
                }}
                placeholder="Search or enter coupon code..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl text-[#111111] dark:text-[#FAFAFA] font-mono placeholder-[#71717A] uppercase focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
              />
              <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !couponCode.trim() || subtotal === 0}
              variant="outline"
              size="sm"
              className="h-9 px-4 text-xs font-medium border-[#ECECEC] dark:border-[#232323] shrink-0"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
            </Button>
          </form>

          {/* Interactive Coupon Suggestions Dropdown */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
              <div className="p-2 border-b border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] flex items-center justify-between text-[11px] font-semibold text-[#71717A] dark:text-[#A1A1AA]">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Available Coupons
                </span>
                {isFetchingCoupons && <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />}
              </div>

              {activeCoupons.length === 0 ? (
                <div className="p-3 text-center text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  {couponCode ? `No active coupon found for "${couponCode}"` : 'No active coupons available'}
                </div>
              ) : (
                <div className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
                  {activeCoupons.map((c) => {
                    const isMinOrderMet = !c.minimumOrderAmount || subtotal >= c.minimumOrderAmount;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => applySelectedCouponCode(c.code)}
                        disabled={subtotal === 0}
                        className={`w-full p-2.5 text-left flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-[#151515] transition-colors ${
                          !isMinOrderMet ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs uppercase text-[#111111] dark:text-[#FAFAFA]">
                              {c.code}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
                              {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                            {c.description || (c.minimumOrderAmount ? `Min order: ₹${c.minimumOrderAmount}` : 'No minimum order required')}
                          </p>
                        </div>

                        {subtotal > 0 && isMinOrderMet && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1 shrink-0">
                            <Check className="w-3 h-3" /> Select
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
