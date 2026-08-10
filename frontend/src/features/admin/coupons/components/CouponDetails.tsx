import React from 'react';
import type { CouponResponse } from '../coupon.types';
import { CouponStatusBadge, DiscountTypeBadge } from './CouponStatusBadge';
import { X, Tag, Calendar } from 'lucide-react';

interface CouponDetailsProps {
  coupon: CouponResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CouponDetails: React.FC<CouponDetailsProps> = ({ coupon, isOpen, onClose }) => {
  if (!isOpen || !coupon) return null;

  const formatDate = (isoString?: string) => {
    if (!isoString) return '--';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ECECEC] dark:border-[#232323]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-mono font-bold text-[#111111] dark:text-[#FAFAFA]">
                {coupon.code}
              </h2>
              <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
                Promotional Coupon Details
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Coupon Attributes */}
        <div className="space-y-4 text-xs">
          {/* Status & Type */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323]">
            <div>
              <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-medium block mb-1">
                Discount Type
              </span>
              <DiscountTypeBadge type={coupon.discountType} />
            </div>

            <div className="text-right">
              <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-medium block mb-1">
                Current Status
              </span>
              <CouponStatusBadge active={coupon.active} />
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] space-y-1">
              <span className="text-[10px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase">
                Discount Value
              </span>
              <p className="text-base font-extrabold text-[#111111] dark:text-[#FAFAFA]">
                {coupon.discountType === 'FLAT'
                  ? `₹${coupon.discountValue.toLocaleString('en-IN')}`
                  : `${coupon.discountValue}%`}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] space-y-1">
              <span className="text-[10px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase">
                Min. Order Amount
              </span>
              <p className="text-base font-extrabold text-[#111111] dark:text-[#FAFAFA]">
                ₹{coupon.minimumOrderAmount?.toLocaleString('en-IN') || 0}
              </p>
            </div>
          </div>

          {coupon.discountType === 'PERCENTAGE' && coupon.maximumDiscount && (
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] space-y-1">
              <span className="text-[10px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase">
                Maximum Discount Cap
              </span>
              <p className="text-sm font-bold text-[#111111] dark:text-[#FAFAFA]">
                ₹{coupon.maximumDiscount.toLocaleString('en-IN')}
              </p>
            </div>
          )}

          {/* Usage Limit & Count */}
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase">
              <span>Usage Progress</span>
              <span>
                {coupon.usedCount} / {coupon.usageLimit} Used
              </span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Description */}
          {coupon.description && (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase">
                Description
              </span>
              <p className="text-xs text-[#111111] dark:text-[#FAFAFA] bg-neutral-50 dark:bg-[#151515] p-2.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] leading-relaxed">
                {coupon.description}
              </p>
            </div>
          )}

          {/* Validity Window */}
          <div className="space-y-2 pt-2 border-t border-[#ECECEC] dark:border-[#232323]">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#71717A] dark:text-[#A1A1AA]">
              <Calendar className="w-3.5 h-3.5" />
              <span>Validity Period</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[#71717A] dark:text-[#A1A1AA] block text-[10px]">Start Date</span>
                <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{formatDate(coupon.startDate)}</span>
              </div>
              <div>
                <span className="text-[#71717A] dark:text-[#A1A1AA] block text-[10px]">End Date</span>
                <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{formatDate(coupon.endDate)}</span>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] space-y-0.5 pt-2 border-t border-[#ECECEC] dark:border-[#232323]">
            <p>Created At: {formatDate(coupon.createdAt)}</p>
            <p>Last Updated: {formatDate(coupon.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
