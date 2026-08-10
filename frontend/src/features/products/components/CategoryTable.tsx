import React from 'react';
import type { CategoryResponse } from '../product.types';
import { ProductStatusBadge } from './ProductStatusBadge';
import { Plus, FolderX, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface CategoryTableProps {
  categories: CategoryResponse[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onAddCategoryClick: () => void;
  onDeactivateCategory?: (id: number) => void;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onAddCategoryClick,
  onDeactivateCategory,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-[#ECECEC] dark:border-[#232323] p-12 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-[#71717A] dark:text-[#A1A1AA]" />
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Loading product categories...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-red-500/20 p-8 text-center space-y-3">
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
          {errorMessage || 'Failed to load categories from server.'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="text-xs border-[#ECECEC] dark:border-[#232323]"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-[#ECECEC] dark:border-[#232323] p-12 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] flex items-center justify-center mx-auto text-[#71717A]">
          <FolderX className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">No categories yet.</h3>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">
            Organize products by creating your first category record.
          </p>
        </div>
        <Button
          onClick={onAddCategoryClick}
          size="sm"
          className="bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] hover:opacity-90 text-xs font-medium gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-[#ECECEC] dark:border-[#232323] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#121212] text-[11px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
              <th className="py-3 px-4">Category Name</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Created At</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323] text-xs text-[#111111] dark:text-[#FAFAFA]">
            {categories.map((cat) => (
              <tr
                key={cat.id}
                className="hover:bg-neutral-50 dark:hover:bg-[#151515] transition-colors"
              >
                <td className="py-3.5 px-4 font-semibold text-[#111111] dark:text-[#FAFAFA]">
                  {cat.name}
                </td>
                <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA]">
                  {cat.description || '—'}
                </td>
                <td className="py-3.5 px-4">
                  <ProductStatusBadge status={cat.status} />
                </td>
                <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA] text-[11px]">
                  {new Date(cat.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {onDeactivateCategory && cat.status === 'ACTIVE' && (
                    <button
                      onClick={() => onDeactivateCategory(cat.id)}
                      className="p-1.5 rounded-lg text-[#71717A] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-xs font-medium"
                      title="Deactivate Category"
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
