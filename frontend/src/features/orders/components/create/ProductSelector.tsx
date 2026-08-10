import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../../../products/productService';
import type { ProductResponse } from '../../../products/product.types';
import { Search, ChevronDown, Plus } from 'lucide-react';

interface ProductSelectorProps {
  onAddProduct: (product: ProductResponse) => void;
  addedProductIds: number[];
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  onAddProduct,
  addedProductIds,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', 'search', debouncedQuery],
    queryFn: () => productService.getProducts({ name: debouncedQuery, page: 0, size: 50 }),
    enabled: isOpen,
    staleTime: 60_000,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const productsList = productsData?.content || [];

  return (
    <div className="space-y-2" ref={dropdownRef}>
      <label className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA] block">
        Add Products <span className="text-red-500">*</span>
      </label>

      <div className="relative">
        <div
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-2.5 flex-1 pr-2">
            <Search className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search product by name or SKU..."
              className="w-full bg-transparent text-xs text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] dark:placeholder-[#A1A1AA] focus:outline-none"
            />
          </div>
          <ChevronDown className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] shrink-0" />
        </div>

        {isOpen && (
          <div className="absolute z-30 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95">
            {isLoading ? (
              <div className="p-3 text-center text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Loading products...
              </div>
            ) : productsList.length === 0 ? (
              <div className="p-3 text-center text-xs text-[#71717A] dark:text-[#A1A1AA]">
                No products found matching &quot;{searchTerm}&quot;
              </div>
            ) : (
              productsList.map((product) => {
                const isAlreadyAdded = addedProductIds.includes(product.id);

                return (
                  <div
                    key={product.id}
                    onClick={() => {
                      if (!isAlreadyAdded) {
                        onAddProduct(product);
                        setIsOpen(false);
                        setSearchTerm('');
                      }
                    }}
                    className={`p-2.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                      isAlreadyAdded
                        ? 'opacity-50 cursor-not-allowed bg-neutral-50 dark:bg-[#151515]'
                        : 'hover:bg-[#FAFAFA] dark:hover:bg-[#151515] cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-[#111111] dark:text-[#FAFAFA]">
                        {product.name}
                      </div>
                      <div className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] font-mono">
                        SKU: {product.sku} • Stock: {product.availableStock} {product.unit}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-[#111111] dark:text-[#FAFAFA]">
                        ₹{product.sellingPrice?.toFixed(2)}
                      </span>
                      {isAlreadyAdded ? (
                        <span className="text-[10px] text-[#71717A]">Added</span>
                      ) : (
                        <div className="w-6 h-6 rounded bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] flex items-center justify-center">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
