import React, { useState, useEffect } from 'react';
import type { OrderStatus } from '../order.types';
import { Search } from 'lucide-react';

interface OrderFiltersProps {
  onSearchChange: (orderNumber: string) => void;
  onStatusChange: (status?: OrderStatus) => void;
  initialOrderNumber?: string;
  initialStatus?: OrderStatus;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  onSearchChange,
  onStatusChange,
  initialOrderNumber = '',
  initialStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialOrderNumber);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange]);

  return (
    <div className="bg-white dark:bg-[#0F0F0F] p-3 rounded-xl border border-[#ECECEC] dark:border-[#232323] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#A1A1AA]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by order # or customer..."
          className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] dark:placeholder-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] transition-colors"
        />
      </div>

      <div className="w-full sm:w-auto flex items-center gap-3">
        {/* Status Selector */}
        <select
          defaultValue={initialStatus || ''}
          onChange={(e) => {
            const val = e.target.value;
            onStatusChange(val ? (val as OrderStatus) : undefined);
          }}
          className="w-full sm:w-48 text-xs px-3 py-1.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] transition-colors font-normal"
        >
          <option value="">All Statuses</option>
          <option value="CREATED">Created</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="VERIFIED">Verified</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
    </div>
  );
};
