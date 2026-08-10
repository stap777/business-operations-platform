import React from 'react';
import { useProductDetails } from '../hooks/useProducts';
import { ProductStatusBadge } from './ProductStatusBadge';
import { Button } from '../../../components/ui/button';
import { X, Package, Loader2, Calendar, Tag, ShieldCheck } from 'lucide-react';

interface ProductDetailsProps {
  productId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({
  productId,
  open,
  onOpenChange,
}) => {
  const { data: product, isLoading, isError } = useProductDetails(open ? productId : null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="bg-white dark:bg-[#0F0F0F] border-l border-[#ECECEC] dark:border-[#232323] w-full max-w-md h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-[#ECECEC] dark:border-[#232323] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-[#1A1A1A] border border-[#ECECEC] dark:border-[#232323] flex items-center justify-center text-[#111111] dark:text-[#FAFAFA]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#111111] dark:text-[#FAFAFA]">
                Product Details
              </h2>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                SKU: {product?.sku || `PROD-${productId}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-[#1A1A1A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#71717A]" />
              <p className="text-xs text-[#71717A]">Fetching product information...</p>
            </div>
          ) : isError || !product ? (
            <div className="py-12 text-center text-xs text-red-500">
              Unable to load product details from server.
            </div>
          ) : (
            <>
              {/* Top Summary Card */}
              <div className="bg-[#FAFAFA] dark:bg-[#151515] p-4 rounded-xl border border-[#ECECEC] dark:border-[#232323] space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#111111] dark:text-[#FAFAFA]">
                      {product.name}
                    </h3>
                    <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1 mt-0.5">
                      <Tag className="w-3.5 h-3.5" />
                      {product.categoryName}
                    </p>
                  </div>
                  <ProductStatusBadge
                    status={product.status}
                    isLowStock={product.availableStock <= product.minimumStock && product.status === 'ACTIVE'}
                  />
                </div>

                {/* Price & Stock Stats Grid */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#ECECEC] dark:border-[#232323]">
                  <div>
                    <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase">Selling Price</p>
                    <p className="text-base font-bold text-[#111111] dark:text-[#FAFAFA]">
                      ₹{Number(product.sellingPrice).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase">Cost Price</p>
                    <p className="text-base font-medium text-[#71717A] dark:text-[#A1A1AA]">
                      ₹{Number(product.purchasePrice).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase">Available Stock</p>
                    <p className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">
                      {product.availableStock} <span className="text-[10px] text-[#71717A]">{product.unit}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase">Min Threshold</p>
                    <p className="text-sm font-medium text-[#71717A] dark:text-[#A1A1AA]">
                      {product.minimumStock} {product.unit}
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Information Details List */}
              <div className="space-y-4 text-xs">
                <h4 className="text-[11px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                  Technical Parameters
                </h4>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between py-2 border-b border-[#ECECEC] dark:border-[#232323]">
                    <span className="text-[#71717A] dark:text-[#A1A1AA]">Measurement Unit</span>
                    <span className="font-medium text-[#111111] dark:text-[#FAFAFA]">{product.unit}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[#ECECEC] dark:border-[#232323]">
                    <span className="text-[#71717A] dark:text-[#A1A1AA]">Track Inventory</span>
                    <span className="font-medium text-[#111111] dark:text-[#FAFAFA] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      {product.trackInventory ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[#ECECEC] dark:border-[#232323]">
                    <span className="text-[#71717A] dark:text-[#A1A1AA]">Created At</span>
                    <span className="font-medium text-[#111111] dark:text-[#FAFAFA] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(product.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[#ECECEC] dark:border-[#232323]">
                    <span className="text-[#71717A] dark:text-[#A1A1AA]">Last Updated</span>
                    <span className="font-medium text-[#111111] dark:text-[#FAFAFA]">
                      {new Date(product.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#ECECEC] dark:border-[#232323]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full text-xs border-[#ECECEC] dark:border-[#232323]"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
