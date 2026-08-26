import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import type { CustomerStatus } from '../customer.types';

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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
        <Input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search by name or phone..."
          className="pl-9 pr-9 text-xs h-9 bg-white dark:bg-[#0F0F0F] border-[#ECECEC] dark:border-[#232323]"
        />
        {term && (
          <button
            type="button"
            onClick={() => {
              setTerm('');
              onSearchChange('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Segmented Status Control */}
      {onStatusChange && (
        <div className="flex items-center p-0.5 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onStatusChange(undefined)}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              !selectedStatus
                ? 'bg-white dark:bg-[#232323] text-[#111111] dark:text-[#FAFAFA] font-medium shadow-xs'
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('ACTIVE')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              selectedStatus === 'ACTIVE'
                ? 'bg-white dark:bg-[#232323] text-emerald-600 dark:text-emerald-400 font-medium shadow-xs'
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('INACTIVE')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              selectedStatus === 'INACTIVE'
                ? 'bg-white dark:bg-[#232323] text-rose-600 dark:text-rose-400 font-medium shadow-xs'
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
            }`}
          >
            Inactive
          </button>
        </div>
      )}
    </div>
  );
};
