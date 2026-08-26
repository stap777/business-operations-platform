import React from 'react';
import type { DiscountType } from '../coupon.types';
import { StatusBadge } from '../../../../components/common/StatusBadge';

interface CouponStatusBadgeProps {
  active?: boolean;
}

export const CouponStatusBadge: React.FC<CouponStatusBadgeProps> = ({ active }) => {
  return <StatusBadge status={active ? 'ACTIVE' : 'INACTIVE'} size="sm" />;
};

interface DiscountTypeBadgeProps {
  type: DiscountType;
}

export const DiscountTypeBadge: React.FC<DiscountTypeBadgeProps> = ({ type }) => {
  return (
    <span
      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider ${
        type === 'FLAT'
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40'
          : 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40'
      }`}
    >
      {type}
    </span>
  );
};
