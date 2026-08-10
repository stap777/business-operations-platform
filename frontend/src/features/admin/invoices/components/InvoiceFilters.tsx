import React, { useState, useEffect } from 'react';
import { Search, Calendar, RotateCcw, Printer } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

interface InvoiceFiltersProps {
  onSearchChange: (query: string) => void;
  onDateRangeChange: (startDate?: string, endDate?: string) => void;
  onPrintAll?: () => void;
  isPreparingPrint?: boolean;
  totalResults?: number;
  initialQuery?: string;
  initialStartDate?: string;
  initialEndDate?: string;
}

export const InvoiceFilters: React.FC<InvoiceFiltersProps> = ({
  onSearchChange,
  onDateRangeChange,
  onPrintAll,
  isPreparingPrint = false,
  totalResults = 0,
  initialQuery = '',
  initialStartDate = '',
  initialEndDate = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange]);

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    onDateRangeChange(start || undefined, end || undefined);
  };

  const handleReset = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    onSearchChange('');
    onDateRangeChange(undefined, undefined);
  };

  const isFiltered = searchTerm !== '' || startDate !== '' || endDate !== '';

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] p-3 rounded-xl shadow-2xs">
      {/* Search Input */}
      <div className="relative w-full md:w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#A1A1AA]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by invoice #, order #, customer..."
          className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] dark:placeholder-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] transition-colors"
        />
      </div>

      {/* Date Pickers & Actions */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
        <div className="flex items-center gap-1.5 text-xs text-[#71717A] dark:text-[#A1A1AA]">
          <Calendar className="w-3.5 h-3.5" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleDateChange(e.target.value, endDate)}
            className="p-1.5 text-xs bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA]"
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleDateChange(startDate, e.target.value)}
            className="p-1.5 text-xs bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA]"
          />
        </div>

        {isFiltered && (
          <button
            onClick={handleReset}
            className="p-2 text-xs font-medium text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA] transition-colors"
            title="Reset Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Secondary Print All Action Button */}
        {onPrintAll && (
          <Button
            variant="outline"
            size="sm"
            disabled={isPreparingPrint}
            onClick={onPrintAll}
            className="h-8 text-xs font-medium border-[#ECECEC] dark:border-[#232323] text-[#111111] dark:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#151515] gap-1.5 shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            Print All {totalResults > 0 && `(${totalResults})`}
          </Button>
        )}
      </div>
    </div>
  );
};
