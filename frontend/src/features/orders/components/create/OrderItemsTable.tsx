import React from 'react';
import type { ProductResponse } from '../../../products/product.types';
import { Minus, Plus, Trash2 } from 'lucide-react';

export interface SelectedOrderItem {
  product: ProductResponse;
  quantity: number;
}

interface OrderItemsTableProps {
  items: SelectedOrderItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
}

export const OrderItemsTable: React.FC<OrderItemsTableProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  if (items.length === 0) {
    return (
      <div className="p-8 border border-dashed border-[#ECECEC] dark:border-[#232323] rounded-xl text-center text-xs text-[#71717A] dark:text-[#A1A1AA] bg-white dark:bg-[#0F0F0F]">
        No products added yet. Use the search bar above to select products.
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
              <th className="py-3 px-4 text-right">Unit Price</th>
              <th className="py-3 px-4 text-center">Qty</th>
              <th className="py-3 px-4 text-right">Total</th>
              <th className="py-3 px-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
            {items.map(({ product, quantity }) => {
              const lineTotal = (product.sellingPrice || 0) * quantity;
              const maxStock = product.availableStock ?? 99999;
              const isMaxStockReached = quantity >= maxStock;

              return (
                <tr
                  key={product.id}
                  className="hover:bg-[#FAFAFA] dark:hover:bg-[#151515] transition-colors"
                >
                  {/* Product Info */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#111111] dark:text-[#FAFAFA]">
                      {product.name}
                    </div>
                    <div className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                      SKU: {product.sku} {product.unit && `• ${product.unit}`}
                    </div>
                  </td>

                  {/* Unit Price */}
                  <td className="py-3.5 px-4 text-right font-mono text-[#71717A] dark:text-[#A1A1AA]">
                    ₹{product.sellingPrice?.toFixed(2)}
                  </td>

                  {/* Qty Stepper */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        disabled={quantity <= 1}
                        onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                        className="w-7 h-7 rounded-md border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] hover:bg-neutral-200 dark:hover:bg-[#232323] flex items-center justify-center text-[#111111] dark:text-[#FAFAFA] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <input
                        type="number"
                        min="1"
                        max={maxStock}
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val > 0) {
                            onUpdateQuantity(product.id, Math.min(val, maxStock));
                          }
                        }}
                        className="w-12 h-7 text-center font-mono font-semibold bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-md text-[#111111] dark:text-[#FAFAFA] focus:outline-none"
                      />

                      <button
                        type="button"
                        disabled={isMaxStockReached}
                        onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                        className="w-7 h-7 rounded-md border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] hover:bg-neutral-200 dark:hover:bg-[#232323] flex items-center justify-center text-[#111111] dark:text-[#FAFAFA] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* Line Total */}
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#111111] dark:text-[#FAFAFA]">
                    ₹{lineTotal.toFixed(2)}
                  </td>

                  {/* Remove Button */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(product.id)}
                      className="p-1.5 rounded-lg text-[#71717A] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
