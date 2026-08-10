import React from 'react';
import type { OrderStatus } from '../delivery.types';

interface DeliveryStatusBadgeProps {
  status: OrderStatus;
}

export const DeliveryStatusBadge: React.FC<DeliveryStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'ASSIGNED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Assigned
        </span>
      );
    case 'OUT_FOR_DELIVERY':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          Out for Delivery
        </span>
      );
    case 'DELIVERED':
    case 'VERIFIED':
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Delivered
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
          {status}
        </span>
      );
  }
};
