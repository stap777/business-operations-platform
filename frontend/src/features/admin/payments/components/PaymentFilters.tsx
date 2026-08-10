import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Filter } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import type { PaymentStatus } from '../payment.types';

interface PaymentFiltersProps {
  onSearchChange: (search: string) => void;
  selectedStatus: 'ALL_OUTSTANDING' | PaymentStatus | 'ALL';
  onStatusChange: (status: 'ALL_OUTSTANDING' | PaymentStatus | 'ALL') => void;
  onRefresh: () => void;
  isFetching: boolean;
}

export const PaymentFilters: React.FC<PaymentFiltersProps> = ({
  onSearchChange,
  selectedStatus,
  onStatusChange,
  onRefresh,
  isFetching,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 300ms Debounce for Search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] p-3 rounded-xl shadow-2xs">
      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#A1A1AA]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search order number or customer..."
          className="w-full pl-9 pr-3 py-1.5 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-xs text-[#111111] dark:text-[#FAFAFA] placeholder:text-[#71717A] dark:placeholder:text-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
        />
      </div>

      {/* Filter Options & Actions */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <div className="flex items-center gap-1 text-xs text-[#71717A] dark:text-[#A1A1AA]">
          <Filter className="w-3.5 h-3.5" />
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value as any)}
            className="h-8 px-2.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] text-xs text-[#111111] dark:text-[#FAFAFA] focus:outline-none cursor-pointer"
          >
            <option value="ALL_OUTSTANDING">Outstanding (Pending & Partial)</option>
            <option value="PENDING">Pending Only</option>
            <option value="PARTIAL">Partial Only</option>
            <option value="PAID">Paid Only</option>
            <option value="ALL">All Payments</option>
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isFetching}
          className="h-8 text-xs border-[#ECECEC] dark:border-[#232323] text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA] gap-1"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
};
