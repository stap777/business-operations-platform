import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../../../products/productService';
import type { CategoryDropdownResponse } from '../../../products/product.types';
import { Search } from 'lucide-react';

interface InventoryFiltersProps {
  onSearchChange: (query: string) => void;
  onCategoryChange: (categoryId?: number) => void;
  onLowStockToggle: (lowStockOnly: boolean) => void;
  initialQuery?: string;
  initialCategoryId?: number;
  initialLowStockOnly?: boolean;
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({
  onSearchChange,
  onCategoryChange,
  onLowStockToggle,
  initialQuery = '',
  initialCategoryId,
  initialLowStockOnly = false,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [lowStock, setLowStock] = useState(initialLowStockOnly);

  // Fetch category dropdown from live backend
  const { data: categories = [] } = useQuery<CategoryDropdownResponse[]>({
    queryKey: ['categories', 'dropdown'],
    queryFn: () => productService.getCategoryDropdown(),
    staleTime: 5 * 60 * 1000,
  });

  // 300ms debounce for search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange]);

  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onCategoryChange(val ? Number(val) : undefined);
  };

  const handleLowStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setLowStock(checked);
    onLowStockToggle(checked);
  };

  return (
    <div className="bg-white dark:bg-[#0F0F0F] p-3 rounded-xl border border-[#ECECEC] dark:border-[#232323] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#A1A1AA]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or SKU..."
          className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] dark:placeholder-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] transition-colors"
        />
      </div>

      <div className="w-full sm:w-auto flex flex-wrap items-center gap-3">
        {/* Category Dropdown */}
        <select
          defaultValue={initialCategoryId || ''}
          onChange={handleCategorySelect}
          className="w-full sm:w-44 text-xs px-3 py-1.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] transition-colors font-normal"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Low Stock Only Toggle */}
        <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] cursor-pointer transition-colors select-none">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={handleLowStockChange}
            className="w-3.5 h-3.5 rounded border-[#ECECEC] text-[#111111] focus:ring-0"
          />
          <span className="font-medium text-xs text-[#111111] dark:text-[#FAFAFA]">Low stock only</span>
        </label>
      </div>
    </div>
  );
};
