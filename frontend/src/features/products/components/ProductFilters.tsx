import React from 'react';
import { Search, Filter, AlertTriangle } from 'lucide-react';
import { useCategoryDropdown } from '../hooks/useCategories';
import { SegmentedControl } from '../../../components/common/SegmentedControl';

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategoryId?: number;
  onCategoryChange: (categoryId?: number) => void;
  selectedStatus?: 'ACTIVE' | 'INACTIVE';
  onStatusChange: (status?: 'ACTIVE' | 'INACTIVE') => void;
  lowStockOnly: boolean;
  onLowStockToggle: (lowStock: boolean) => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategoryId,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  lowStockOnly,
  onLowStockToggle,
}) => {
  const { data: categories = [] } = useCategoryDropdown();

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-[#18181B] p-3 rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] shadow-xs">
      {/* Search Bar */}
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search product by name, SKU..."
          className="w-full pl-10 pr-4 py-2 text-xs bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] placeholder-[#71717A] dark:placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
        />
      </div>

      {/* Filter Dropdowns & Status Tabs */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Status Filter Segmented Control */}
        <SegmentedControl
          value={selectedStatus || 'ALL'}
          onChange={(val) => onStatusChange(val === 'ALL' ? undefined : (val as 'ACTIVE' | 'INACTIVE'))}
          options={[
            { label: 'All', value: 'ALL' },
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Inactive', value: 'INACTIVE' },
          ]}
          size="sm"
        />

        {/* Category Dropdown */}
        <div className="relative">
          <select
            value={selectedCategoryId || ''}
            onChange={(e) =>
              onCategoryChange(e.target.value ? Number(e.target.value) : undefined)
            }
            className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 cursor-pointer font-medium"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA] pointer-events-none" />
        </div>

        {/* Low Stock Toggle Button */}
        <button
          type="button"
          onClick={() => onLowStockToggle(!lowStockOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
            lowStockOnly
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold'
              : 'bg-[#F4F4F5] dark:bg-[#121214] border-[#E4E4E7]/60 dark:border-[#27272A]/60 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-[#FAFAFA]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Low Stock
        </button>
      </div>
    </div>
  );
};
