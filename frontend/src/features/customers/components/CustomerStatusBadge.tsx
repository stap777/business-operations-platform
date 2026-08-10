import React from 'react';
import type { CustomerStatus } from '../customer.types';

interface CustomerStatusBadgeProps {
  status: CustomerStatus;
}

export const CustomerStatusBadge: React.FC<CustomerStatusBadgeProps> = ({ status }) => {
  const isActive = status === 'ACTIVE';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide border ${
        isActive
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
          : 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isActive ? 'bg-emerald-500' : 'bg-neutral-400'
        }`}
      />
      {status}
    </span>
  );
};
