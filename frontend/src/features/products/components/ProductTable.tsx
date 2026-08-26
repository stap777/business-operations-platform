import React, { useState } from 'react';
import type { ProductResponse } from '../product.types';
import { ProductStatusBadge } from './ProductStatusBadge';
import { Eye, Plus, PackageX, RefreshCw, Boxes, MoreVertical, Edit, RotateCcw } from 'lucide-react';
import { Button } from '../../../components/ui/button';

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
  onUpdateStock,
}) => {
  const [openActionId, setOpenActionId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-[#ECECEC] dark:border-[#232323] p-12 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-[#71717A] dark:text-[#A1A1AA]" />
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Loading products catalog...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-red-500/20 p-8 text-center space-y-3">
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
          {errorMessage || 'Failed to load products list from server.'}
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

  if (!products || products.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-[#ECECEC] dark:border-[#232323] p-12 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] flex items-center justify-center mx-auto text-[#71717A]">
          <PackageX className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">No products yet.</h3>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">
            Get started by adding your first product record to inventory.
          </p>
        </div>
        <Button
          onClick={onAddProductClick}
          size="sm"
          className="bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] hover:opacity-90 text-xs font-medium gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Product
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
          <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323] text-xs text-[#111111] dark:text-[#FAFAFA]">
            {products.map((product) => {
              const isLowStock = product.availableStock <= product.minimumStock;
              const isInactive = product.status === 'INACTIVE';

              return (
                <tr
                  key={product.id}
                  className={`hover:bg-neutral-50 dark:hover:bg-[#151515] transition-colors ${
                    isInactive ? 'opacity-60 bg-neutral-50/50 dark:bg-neutral-900/30' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-mono font-medium text-[#71717A] dark:text-[#A1A1AA]">
                    {product.sku}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#111111] dark:text-[#FAFAFA]">
                    {product.name}
                  </td>
                  <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA]">
                    {product.categoryName}
                  </td>
                  <td className="py-3.5 px-4 font-medium">
                    ₹{Number(product.sellingPrice).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA]">
                    ₹{Number(product.purchasePrice).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 font-semibold">
                    {product.availableStock} <span className="text-[10px] text-[#71717A] font-normal">{product.unit}</span>
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
                  <td className="py-3.5 px-4 text-right relative">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setOpenActionId(openActionId === product.id ? null : product.id)}
                        className="p-1.5 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-[#1A1A1A] transition-colors"
                        title="Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openActionId === product.id && (
                        <div
                          className="absolute right-4 top-10 z-20 w-44 bg-white dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-xl shadow-lg py-1 text-xs text-left"
                          onMouseLeave={() => setOpenActionId(null)}
                        >
                          <button
                            onClick={() => {
                              setOpenActionId(null);
                              onViewProduct(product.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[#111111] dark:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-[#232323] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#71717A]" />
                            View Details
                          </button>

                          {onEditProduct && (
                            <button
                              onClick={() => {
                                setOpenActionId(null);
                                onEditProduct(product);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-[#111111] dark:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-[#232323] transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5 text-blue-500" />
                              Edit Product
                            </button>
                          )}

                          {onUpdateStock && (
                            <button
                              onClick={() => {
                                setOpenActionId(null);
                                onUpdateStock(product);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                            >
                              <Boxes className="w-3.5 h-3.5" />
                              Adjust Stock
                            </button>
                          )}

                          {onDeactivateProduct && product.status === 'ACTIVE' && (
                            <button
                              onClick={() => {
                                setOpenActionId(null);
                                onDeactivateProduct(product.id);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            >
                              <PackageX className="w-3.5 h-3.5" />
                              Deactivate
                            </button>
                          )}

                          {onRestoreProduct && product.status === 'INACTIVE' && (
                            <button
                              onClick={() => {
                                setOpenActionId(null);
                                onRestoreProduct(product.id);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Restore Product
                            </button>
                          )}
                        </div>
                      )}
                    </div>
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
