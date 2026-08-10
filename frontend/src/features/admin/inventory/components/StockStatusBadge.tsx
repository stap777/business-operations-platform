import React from 'react';
import type { StockStatusType } from '../inventory.types';

interface StockStatusBadgeProps {
  status: StockStatusType;
}

export const StockStatusBadge: React.FC<StockStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'IN_STOCK':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          In stock
        </span>
      );
    case 'LOW_STOCK':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Low stock
        </span>
      );
    case 'OUT_OF_STOCK':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Out of stock
        </span>
      );
    case 'NOT_TRACKED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600" />
          Not tracked
        </span>
      );
    default:
      return null;
  }
};
