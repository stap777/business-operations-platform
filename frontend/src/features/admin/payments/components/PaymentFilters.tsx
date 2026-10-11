import React, { useState, useEffect, useRef } from 'react';
import { Search, RefreshCw, Filter, Calendar, RotateCcw } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import type { PaymentStatus } from '../payment.types';

interface PaymentFiltersProps {
  onSearchChange: (search: string) => void;
  selectedStatus: 'ALL_OUTSTANDING' | PaymentStatus | 'ALL';
  onStatusChange: (status: 'ALL_OUTSTANDING' | PaymentStatus | 'ALL') => void;
  startDate?: string;
  endDate?: string;
  onDateChange: (startDate?: string, endDate?: string) => void;
  onRefresh: () => void;
  isFetching: boolean;
}

export const PaymentFilters: React.FC<PaymentFiltersProps> = ({
  onSearchChange,
  selectedStatus,
  onStatusChange,
  startDate,
  endDate,
  onDateChange,
  onRefresh,
  isFetching,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const prevSearchRef = useRef<string>(searchTerm);

  // 300ms Debounce for Search input
  useEffect(() => {
    if (prevSearchRef.current === searchTerm) {
      return;
    }
    const timer = setTimeout(() => {
      prevSearchRef.current = searchTerm;
      onSearchChange(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange]);

  const handleStartDateChange = (val: string) => {
    let adjustedEnd = endDate;
    if (val && endDate && val > endDate) {
      adjustedEnd = val;
    }
    onDateChange(val || undefined, adjustedEnd || undefined);
  };

  const handleEndDateChange = (val: string) => {
    if (startDate && val && val < startDate) {
      return;
    }
    onDateChange(startDate || undefined, val || undefined);
  };

  const handleClearDates = () => {
    onDateChange(undefined, undefined);
  };

  return (
    <div className="flex flex-col gap-3 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] p-3 rounded-xl shadow-2xs">
      {/* Top Search & Primary Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
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

      {/* Date Range Filter Controls */}
      <div className="pt-2.5 border-t border-[#ECECEC] dark:border-[#232323] flex flex-wrap items-center justify-between gap-3 text-xs text-[#71717A] dark:text-[#A1A1AA]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-[11px] uppercase tracking-wider text-[#111111] dark:text-[#FAFAFA]">
            <Calendar className="w-3.5 h-3.5 text-[#111111] dark:text-[#FAFAFA]" />
            Date Filter:
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-[#71717A] dark:text-[#A1A1AA]">
              <span className="text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA]">Start Date:</span>
              <input
                type="date"
                aria-label="Start Date"
                value={startDate || ''}
                max={endDate || undefined}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="p-1.5 text-xs bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
              />
            </label>

            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">to</span>

            <label className="flex items-center gap-1.5 text-xs text-[#71717A] dark:text-[#A1A1AA]">
              <span className="text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA]">End Date:</span>
              <input
                type="date"
                aria-label="End Date"
                value={endDate || ''}
                min={startDate || undefined}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="p-1.5 text-xs bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
              />
            </label>
          </div>

          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearDates}
              className="h-7 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1 px-2 rounded-lg"
              title="Clear date filter"
            >
              <RotateCcw className="w-3 h-3" />
              Clear Dates
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
