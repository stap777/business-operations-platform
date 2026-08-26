import React from 'react';
import type { ProductResponse } from '../product.types';
import { ProductStatusBadge } from './ProductStatusBadge';
import { Eye, PackageX, RefreshCw, Boxes, Edit, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { ActionDropdownMenu } from '../../../components/common/ActionDropdownMenu';
import type { ActionMenuItem } from '../../../components/common/ActionDropdownMenu';
import { EmptyState } from '../../../components/common/EmptyState';
import { TableSkeleton } from '../../../components/common/TableSkeleton';

interface ProductTableProps {
  products: ProductResponse[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onViewProduct: (id: number) => void;
  onAddProductClick: () => void;
  onEditProduct?: (product: ProductResponse) => void;
  onDeactivateProduct?: (id: number) => void;
  onRestoreProduct?: (id: number) => void;
  onDeleteProduct?: (product: ProductResponse) => void;
  onUpdateStock?: (product: ProductResponse) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onViewProduct,
  onAddProductClick,
  onEditProduct,
  onDeactivateProduct,
  onRestoreProduct,
  onDeleteProduct,
  onUpdateStock,
}) => {
  if (isLoading) {
    return <TableSkeleton columns={9} rows={8} />;
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-red-500/20 p-8 text-center space-y-3">
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
          {errorMessage || 'Failed to load products list from server.'}
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

  if (!products || products.length === 0) {
    return (
      <EmptyState
        title="No products found"
        description="There are no products matching your filter criteria."
        actionLabel="Add Product"
        onAction={onAddProductClick}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#121214] text-[11px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4">Product Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Selling Price</th>
              <th className="py-3 px-4">Cost Price</th>
              <th className="py-3 px-4">Available Stock</th>
              <th className="py-3 px-4">Min Stock</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Created At</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E7]/60 dark:divide-[#27272A]/60 text-xs text-[#09090B] dark:text-[#FAFAFA]">
            {products.map((product) => {
              const isLowStock = product.availableStock <= product.minimumStock;
              const isInactive = product.status === 'INACTIVE';

              const menuItems: ActionMenuItem[] = [
                {
                  label: 'View Details',
                  icon: Eye,
                  onClick: () => onViewProduct(product.id),
                },
              ];

              if (onEditProduct) {
                menuItems.push({
                  label: 'Edit Product',
                  icon: Edit,
                  onClick: () => onEditProduct(product),
                });
              }

              if (onUpdateStock) {
                menuItems.push({
                  label: 'Adjust Stock',
                  icon: Boxes,
                  onClick: () => onUpdateStock(product),
                });
              }

              if (onDeactivateProduct && product.status === 'ACTIVE') {
                menuItems.push({
                  label: 'Deactivate',
                  icon: PackageX,
                  variant: 'danger',
                  onClick: () => onDeactivateProduct(product.id),
                });
              }

              if (onRestoreProduct && product.status === 'INACTIVE') {
                menuItems.push({
                  label: 'Restore',
                  icon: RotateCcw,
                  onClick: () => onRestoreProduct(product.id),
                });
              }

              if (onDeleteProduct) {
                menuItems.push({
                  label: 'Delete Product',
                  icon: Trash2,
                  variant: 'danger',
                  onClick: () => onDeleteProduct(product),
                });
              }

              return (
                <tr
                  key={product.id}
                  className={`h-14 hover:bg-[#F4F4F5]/60 dark:hover:bg-[#27272A]/40 transition-colors ${
                    isInactive ? 'opacity-70 bg-[#FAFAFA]/50 dark:bg-black/20' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-mono font-medium text-[#71717A] dark:text-[#A1A1AA]">
                    {product.sku}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#09090B] dark:text-[#FAFAFA]">
                    {product.name}
                  </td>
                  <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA]">
                    {product.categoryName}
                  </td>
                  <td className="py-3.5 px-4 font-semibold">
                    ₹{Number(product.sellingPrice).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA]">
                    ₹{Number(product.purchasePrice).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 font-semibold">
                    {product.availableStock}{' '}
                    <span className="text-[10px] text-[#71717A] font-normal">{product.unit}</span>
                  </td>
                  <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA]">
                    {product.minimumStock}
                  </td>
                  <td className="py-3.5 px-4">
                    <ProductStatusBadge
                      status={product.status}
                      isLowStock={isLowStock && product.status === 'ACTIVE'}
                    />
                  </td>
                  <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA] text-[11px]">
                    {new Date(product.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
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
