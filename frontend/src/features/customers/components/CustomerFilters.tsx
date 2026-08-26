import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import type { CustomerStatus } from '../customer.types';
import { SegmentedControl } from '../../../components/common/SegmentedControl';

interface CustomerFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus?: CustomerStatus;
  onStatusChange?: (status?: CustomerStatus) => void;
}

export const CustomerFilters: React.FC<CustomerFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
}) => {
  const [term, setTerm] = useState(searchQuery);

  useEffect(() => {
    setTerm(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (term !== searchQuery) {
        onSearchChange(term);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [term, searchQuery, onSearchChange]);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#18181B] p-3 rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] shadow-xs">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search customer by name or phone..."
          className="w-full pl-10 pr-9 py-2 text-xs bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
        />
        {term && (
          <button
            type="button"
            onClick={() => {
              setTerm('');
              onSearchChange('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-[#FAFAFA]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {onStatusChange && (
        <SegmentedControl
          value={selectedStatus || 'ALL'}
          onChange={(val) => onStatusChange(val === 'ALL' ? undefined : (val as CustomerStatus))}
          options={[
            { label: 'All', value: 'ALL' },
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Inactive', value: 'INACTIVE' },
          ]}
          size="sm"
        />
      )}
    </div>
  );
};
