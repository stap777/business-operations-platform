import React from 'react';
import type { CategoryResponse } from '../product.types';
import { RefreshCw, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { ActionDropdownMenu } from '../../../components/common/ActionDropdownMenu';
import type { ActionMenuItem } from '../../../components/common/ActionDropdownMenu';
import { EmptyState } from '../../../components/common/EmptyState';

import { TableSkeleton } from '../../../components/common/TableSkeleton';

interface CategoryTableProps {
  categories: CategoryResponse[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onAddCategoryClick: () => void;
  onEditCategory?: (category: CategoryResponse) => void;
  onDeleteCategory?: (category: CategoryResponse) => void;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onAddCategoryClick,
  onEditCategory,
  onDeleteCategory,
}) => {
  if (isLoading) {
    return <TableSkeleton columns={4} rows={6} />;
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-red-500/20 p-8 text-center space-y-3">
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
          {errorMessage || 'Failed to load categories from server.'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="text-xs rounded-xl border-[#E4E4E7] dark:border-[#27272A]"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <EmptyState
        title="No categories found"
        description="Organize your catalog by creating your first product category."
        actionLabel="Add Category"
        onAction={onAddCategoryClick}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#121214] text-[11px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
              <th className="py-3 px-4">Category Name</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E7]/60 dark:divide-[#27272A]/60 text-xs text-[#09090B] dark:text-[#FAFAFA]">
            {categories.map((cat) => {
              const menuItems: ActionMenuItem[] = [];

              if (onEditCategory) {
                menuItems.push({
                  label: 'Edit',
                  icon: Edit,
                  onClick: () => onEditCategory(cat),
                });
              }

              if (onDeleteCategory) {
                menuItems.push({
                  label: 'Delete',
                  icon: Trash2,
                  variant: 'danger',
                  onClick: () => onDeleteCategory(cat),
                });
              }

              return (
                <tr
                  key={cat.id}
                  className="h-14 hover:bg-[#F4F4F5]/60 dark:hover:bg-[#27272A]/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-semibold text-[#09090B] dark:text-[#FAFAFA]">
                    {cat.name}
                  </td>
                  <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA] max-w-md truncate">
                    {cat.description || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <ActionDropdownMenu items={menuItems} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
