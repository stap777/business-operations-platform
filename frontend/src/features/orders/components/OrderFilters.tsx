import React, { useState, useEffect } from 'react';
import type { OrderStatus } from '../order.types';
import { Search, Filter, RotateCcw, Calendar } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface OrderFiltersProps {
  onSearchChange: (orderNumber: string) => void;
  onStatusChange: (status?: OrderStatus) => void;
  onDateRangeChange?: (startDate?: string, endDate?: string) => void;
  onClearFilters?: () => void;
  initialOrderNumber?: string;
  initialStatus?: OrderStatus;
  initialStartDate?: string;
  initialEndDate?: string;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  onSearchChange,
  onStatusChange,
  onDateRangeChange,
  onClearFilters,
  initialOrderNumber = '',
  initialStatus,
  initialStartDate = '',
  initialEndDate = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(initialOrderNumber);
  const [status, setStatus] = useState<string>(initialStatus || '');
  const [startDate, setStartDate] = useState<string>(initialStartDate);
  const [endDate, setEndDate] = useState<string>(initialEndDate);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange]);

  const handleStatusChange = (val: string) => {
    setStatus(val);
    onStatusChange(val ? (val as OrderStatus) : undefined);
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (onDateRangeChange) {
      onDateRangeChange(val || undefined, endDate || undefined);
    }
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    if (onDateRangeChange) {
      onDateRangeChange(startDate || undefined, val || undefined);
    }
  };

  const handleClearAll = () => {
    setSearchTerm('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    if (onClearFilters) {
      onClearFilters();
    }
  };

  const hasActiveFilters = Boolean(searchTerm || status || startDate || endDate);

  return (
    <div className="bg-white dark:bg-[#0F0F0F] p-3 sm:p-4 rounded-xl border border-[#ECECEC] dark:border-[#232323] shadow-xs space-y-3">
      {/* Top Search & Primary Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#A1A1AA]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search order # or customer..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] dark:placeholder-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] transition-colors"
          />
        </div>

        {/* Filter Actions */}
        <div className="w-full sm:w-auto flex items-center gap-2 justify-end">
          {/* Status Selector */}
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full sm:w-44 text-xs px-3 py-2 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] cursor-pointer"
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

          {/* Date Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            className={`h-9 text-xs gap-1.5 border-[#ECECEC] dark:border-[#232323] ${
              showAdvancedFilters || startDate || endDate
                ? 'bg-neutral-100 dark:bg-[#1F1F1F] text-[#111111] dark:text-[#FAFAFA]'
                : 'text-[#71717A] dark:text-[#A1A1AA]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Dates
          </Button>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-9 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1 px-2.5"
              title="Clear all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Date Range Inputs */}
      {showAdvancedFilters && (
        <div className="pt-2 border-t border-[#ECECEC] dark:border-[#232323] flex flex-wrap items-center gap-3 text-xs text-[#71717A] dark:text-[#A1A1AA] animate-in fade-in">
          <span className="flex items-center gap-1 font-medium text-[11px] uppercase">
            <Calendar className="w-3.5 h-3.5 text-[#111111] dark:text-[#FAFAFA]" /> Date Range:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="px-2.5 py-1.5 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] text-xs"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="px-2.5 py-1.5 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
};
