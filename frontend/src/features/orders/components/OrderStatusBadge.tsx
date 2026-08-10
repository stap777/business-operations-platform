import React from 'react';
import type { OrderStatus, PaymentStatus, DeliveryStatus } from '../order.types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'CREATED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
          Created
        </span>
      );
    case 'ASSIGNED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Assigned
        </span>
      );
    case 'OUT_FOR_DELIVERY':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          Out for Delivery
        </span>
      );
    case 'DELIVERED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Delivered
        </span>
      );
    case 'VERIFIED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          Verified
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          Completed
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
          {status}
        </span>
      );
  }
};

export const PaymentStatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  switch (status) {
    case 'PAID':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          Paid
        </span>
      );
    case 'PARTIAL':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
          Partial
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
          Pending
        </span>
      );
  }
};

export const DeliveryStatusBadge: React.FC<{ status: DeliveryStatus }> = ({ status }) => {
  switch (status) {
    case 'DELIVERED':
      return <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Delivered</span>;
    case 'OUT_FOR_DELIVERY':
      return <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Out for Delivery</span>;
    case 'PENDING':
    default:
      return <span className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">Pending</span>;
  }
};
