import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../../../components/ui/input';

interface CustomerFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const CustomerFilters: React.FC<CustomerFiltersProps> = ({
  searchQuery,
  onSearchChange,
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
    </div>
  );
};
