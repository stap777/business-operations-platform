import React from 'react';
import type { ProductResponse } from '../../../products/product.types';
import { deriveStockStatus } from '../inventory.types';
import { StockStatusBadge } from './StockStatusBadge';
import { Button } from '../../../../components/ui/button';

interface InventoryTableProps {
  products: ProductResponse[];
  isLoading: boolean;
  onAdjustStock: (product: ProductResponse) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  products,
  isLoading,
  onAdjustStock,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-[#FAFAFA] dark:bg-[#151515] animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl p-12 text-center shadow-sm">
        <h3 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">No inventory records found</h3>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1 max-w-sm mx-auto">
          Products with inventory tracking enabled will appear here once added to the catalog.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA]/50 dark:bg-[#151515]/50 text-[#71717A] dark:text-[#A1A1AA] font-medium text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-right">Available Stock</th>
              <th className="py-3 px-4 text-right">Min. Threshold</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
            {products.map((product) => {
              const status = deriveStockStatus(product);

              return (
                <tr
                  key={product.id}
                  className="hover:bg-[#FAFAFA] dark:hover:bg-[#151515] transition-colors"
                >
                  <td className="py-3.5 px-4 font-medium text-[#111111] dark:text-[#FAFAFA]">
                    {product.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#71717A] dark:text-[#A1A1AA]">
                    {product.sku}
                  </td>
                  <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA]">
                    {product.categoryName}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#111111] dark:text-[#FAFAFA]">
                    {product.availableStock?.toLocaleString('en-IN') ?? 0} <span className="text-[10px] font-normal text-[#71717A] dark:text-[#A1A1AA]">{product.unit}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[#71717A] dark:text-[#A1A1AA]">
                    {product.minimumStock?.toLocaleString('en-IN') ?? 0}
                  </td>
                  <td className="py-3.5 px-4">
                    <StockStatusBadge status={status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAdjustStock(product)}
                      className="h-7 text-xs font-medium px-2.5 border-[#ECECEC] dark:border-[#232323] hover:bg-[#FAFAFA] dark:hover:bg-[#151515]"
                    >
                      Adjust
                    </Button>
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
