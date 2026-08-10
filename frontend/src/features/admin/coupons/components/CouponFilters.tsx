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

  // 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange]);

  const handleStatusSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'ALL') {
      onStatusChange(undefined);
    } else if (val === 'ACTIVE') {
      onStatusChange(true);
    } else if (val === 'INACTIVE') {
      onStatusChange(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="relative w-full sm:w-72">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#A1A1AA]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search coupons by code or description..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:border-[#111111] dark:focus:border-[#FAFAFA] transition-colors"
        />
      </div>

      <div className="w-full sm:w-auto flex items-center gap-2">
        <select
          defaultValue={initialActive === undefined ? 'ALL' : initialActive ? 'ACTIVE' : 'INACTIVE'}
          onChange={handleStatusSelect}
          className="w-full sm:w-40 text-xs px-3 py-2 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:border-[#111111] dark:focus:border-[#FAFAFA] transition-colors font-medium"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>
    </div>
  );
};
