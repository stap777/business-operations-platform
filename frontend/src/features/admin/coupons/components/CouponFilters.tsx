import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { SegmentedControl } from '../../../../components/common/SegmentedControl';

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

  const handleStatusChange = (val: string) => {
    const status = val === 'ALL' ? undefined : val === 'ACTIVE';
    setActiveStatus(status);
    onStatusChange(status);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#18181B] p-3 rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] shadow-xs">
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#A1A1AA]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search coupon by code or description..."
          className="w-full pl-10 pr-4 py-2 text-xs bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
        />
      </div>

      <SegmentedControl
        value={activeStatus === undefined ? 'ALL' : activeStatus ? 'ACTIVE' : 'INACTIVE'}
        onChange={handleStatusChange}
        options={[
          { label: 'All', value: 'ALL' },
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Inactive', value: 'INACTIVE' },
        ]}
        size="sm"
      />
    </div>
  );
};
