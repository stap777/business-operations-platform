import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface CouponFiltersProps {
  onSearchChange: (query: string) => void;
  onStatusChange: (active?: boolean) => void;
  initialQuery?: string;
  initialActive?: boolean;
}

export const CouponFilters: React.FC<CouponFiltersProps> = ({
  onSearchChange,
  onStatusChange,
  initialQuery = '',
  initialActive,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeStatus, setActiveStatus] = useState<boolean | undefined>(initialActive);

  // 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange]);

  const handleStatusClick = (status?: boolean) => {
    setActiveStatus(status);
    onStatusChange(status);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#A1A1AA]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search coupons by code or description..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:border-[#111111] dark:focus:border-[#FAFAFA] transition-colors"
        />
      </div>

      {/* Segmented Status Control */}
      <div className="flex items-center p-0.5 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-xs self-start sm:self-auto">
        <button
          type="button"
          onClick={() => handleStatusClick(undefined)}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            activeStatus === undefined
              ? 'bg-white dark:bg-[#232323] text-[#111111] dark:text-[#FAFAFA] font-medium shadow-xs'
              : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => handleStatusClick(true)}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            activeStatus === true
              ? 'bg-white dark:bg-[#232323] text-emerald-600 dark:text-emerald-400 font-medium shadow-xs'
              : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
          }`}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => handleStatusClick(false)}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            activeStatus === false
              ? 'bg-white dark:bg-[#232323] text-rose-600 dark:text-rose-400 font-medium shadow-xs'
              : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
          }`}
        >
          Inactive
        </button>
      </div>
    </div>
  );
};
