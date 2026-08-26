import React from 'react';

export type StatusVariant =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'VERIFIED'
  | 'UNVERIFIED'
  | 'PENDING'
  | 'CANCELLED'
  | 'DELIVERED'
  | 'OUT_FOR_DELIVERY'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'IN_STOCK'
  | 'PAID'
  | 'PARTIAL'
  | 'UNPAID'
  | 'CREDIT'
  | 'ADMIN'
  | 'MANAGER'
  | 'SALES_REPRESENTATIVE'
  | 'DELIVERY_PERSON'
  | string;

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  className = '',
}) => {
  const normalized = (status || '').toUpperCase();
  const displayText = label || formatStatusLabel(normalized);

  const styleClass = getStatusStyles(normalized);
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-colors select-none ${
        isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${styleClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current opacity-80" />
      <span>{displayText}</span>
    </span>
  );
};

function formatStatusLabel(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'INACTIVE':
      return 'Inactive';
    case 'VERIFIED':
      return 'Verified';
    case 'UNVERIFIED':
      return 'Unverified';
    case 'PENDING':
      return 'Pending';
    case 'CANCELLED':
      return 'Cancelled';
    case 'DELIVERED':
      return 'Delivered';
    case 'OUT_FOR_DELIVERY':
      return 'Out for Delivery';
    case 'LOW_STOCK':
      return 'Low Stock';
    case 'OUT_OF_STOCK':
      return 'Out of Stock';
    case 'IN_STOCK':
      return 'In Stock';
    case 'PAID':
      return 'Paid';
    case 'PARTIAL':
      return 'Partial';
    case 'UNPAID':
      return 'Unpaid';
    case 'CREDIT':
      return 'Credit';
    case 'ADMIN':
      return 'Administrator';
    case 'MANAGER':
      return 'Manager';
    case 'SALES_REPRESENTATIVE':
      return 'Sales Rep';
    case 'DELIVERY_PERSON':
      return 'Delivery Agent';
    default:
      return status.replace(/_/g, ' ');
  }
}

function getStatusStyles(status: string): string {
  switch (status) {
    case 'ACTIVE':
    case 'VERIFIED':
    case 'DELIVERED':
    case 'PAID':
    case 'IN_STOCK':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40';

    case 'INACTIVE':
    case 'CANCELLED':
    case 'OUT_OF_STOCK':
    case 'UNPAID':
      return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/40';

    case 'PENDING':
    case 'UNVERIFIED':
    case 'PARTIAL':
    case 'OUT_FOR_DELIVERY':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40';

    case 'LOW_STOCK':
      return 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/40';

    case 'CREDIT':
      return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40';

    case 'ADMIN':
      return 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40';

    case 'SALES_REPRESENTATIVE':
    case 'MANAGER':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40';

    default:
      return 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700';
  }
}
