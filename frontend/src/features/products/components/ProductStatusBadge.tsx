import React from 'react';
import type { ProductStatus, CategoryStatus } from '../product.types';

interface ProductStatusBadgeProps {
  status: ProductStatus | CategoryStatus;
  isLowStock?: boolean;
}

export const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({
  status,
  isLowStock,
}) => {
  if (isLowStock) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        Low Stock
      </span>
    );
  }

  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20">
      Inactive
    </span>
  );
};
