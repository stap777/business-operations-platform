import React from 'react';
import type { DiscountType } from '../coupon.types';

interface CouponStatusBadgeProps {
  active?: boolean;
}

export const CouponStatusBadge: React.FC<CouponStatusBadgeProps> = ({ active }) => {
  if (active) {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
        ACTIVE
      </span>
    );
  }

  return (
    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
      INACTIVE
    </span>
  );
};

interface DiscountTypeBadgeProps {
  type: DiscountType;
}

export const DiscountTypeBadge: React.FC<DiscountTypeBadgeProps> = ({ type }) => {
  if (type === 'FLAT') {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
        FLAT
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
      PERCENTAGE
    </span>
  );
};
