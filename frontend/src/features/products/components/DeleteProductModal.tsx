import React from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/ui/button';
import { useProductDeletionCheck } from '../hooks/useProducts';
import type { ProductResponse } from '../product.types';
import { AlertTriangle, AlertCircle, Loader2, ShieldAlert, PackageX } from 'lucide-react';

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductResponse | null;
  onConfirmDelete: (id: number) => void;
  onDeactivate: (id: number) => void;
  isDeleting?: boolean;
  isDeactivating?: boolean;
}

export const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onConfirmDelete,
  onDeactivate,
  isDeleting = false,
  isDeactivating = false,
}) => {
  const {
    data: checkData,
    isLoading: isChecking,
    isError,
    error,
    refetch,
  } = useProductDeletionCheck(isOpen && product ? product.id : null);

  if (!isOpen || !product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isChecking
          ? 'Checking Product History...'
          : checkData?.canDelete
          ? 'Permanently Delete Product'
          : 'Product Cannot Be Deleted'
      }
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Loading State */}
        {isChecking && (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#71717A] dark:text-[#A1A1AA]" />
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Checking orders and inventory history for <strong>"{product.name}"</strong>...
            </p>
          </div>
        )}

        {/* Error State */}
        {!isChecking && isError && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>Failed to check product usage</span>
            </div>
            <p className="text-[11px]">
              {(error as any)?.message || 'Could not verify whether this product has historical orders.'}
            </p>
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="text-xs h-7 px-3 border-red-200 dark:border-red-900/40"
              >
                Retry Check
              </Button>
            </div>
          </div>
        )}

        {/* Scenario 1: Product CAN be safely deleted (No order or stock history) */}
        {!isChecking && !isError && checkData?.canDelete && (
          <>
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-800 dark:text-rose-200 leading-relaxed">
                  <p className="font-semibold text-rose-900 dark:text-rose-100">
                    Completely remove "{product.name}" from database?
                  </p>
                  <p className="mt-1 text-rose-700 dark:text-rose-300">
                    This product was never used in any sales orders, invoice items, or stock adjustments. It will be permanently removed from the system.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] text-xs space-y-1.5">
              <div className="flex justify-between text-[#71717A] dark:text-[#A1A1AA]">
                <span>SKU:</span>
                <span className="font-mono font-medium text-[#111111] dark:text-[#FAFAFA]">{product.sku}</span>
              </div>
              <div className="flex justify-between text-[#71717A] dark:text-[#A1A1AA]">
                <span>Category:</span>
                <span className="font-medium text-[#111111] dark:text-[#FAFAFA]">{product.categoryName}</span>
              </div>
              <div className="flex justify-between text-[#71717A] dark:text-[#A1A1AA]">
                <span>Current Stock:</span>
                <span className="font-medium text-[#111111] dark:text-[#FAFAFA]">{product.availableStock} {product.unit}</span>
              </div>
            </div>

            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              <strong>Warning:</strong> This action cannot be undone. Use this only to remove accidental or duplicate entries created by mistake.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ECECEC] dark:border-[#232323]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isDeleting}
                className="text-xs rounded-xl border-[#ECECEC] dark:border-[#232323] min-h-[40px]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => onConfirmDelete(product.id)}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl min-h-[40px] px-4 shadow-xs gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Permanently Delete Product'
                )}
              </Button>
            </div>
          </>
        )}

        {/* Scenario 2: Product CANNOT be deleted (Referenced by historical orders/adjustments) */}
        {!isChecking && !isError && checkData && !checkData.canDelete && (
          <>
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 space-y-2">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <p className="font-semibold text-amber-950 dark:text-amber-100">
                    This product cannot be permanently deleted because it is used in existing orders. You can deactivate it instead.
                  </p>
                  <p className="mt-1 text-amber-800 dark:text-amber-300">
                    To maintain database integrity and audit history, items that have historical transactions cannot be physically deleted.
                  </p>
                </div>
              </div>
            </div>

            {/* Historical References Breakdown */}
            <div className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] text-xs space-y-2">
              <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider block">
                Historical Transaction References
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-white dark:bg-[#1A1A1A] border border-[#ECECEC] dark:border-[#232323]">
                  <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] block">Order Line Items:</span>
                  <span className="font-mono font-bold text-sm text-[#111111] dark:text-[#FAFAFA]">
                    {checkData.orderItemCount}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-[#1A1A1A] border border-[#ECECEC] dark:border-[#232323]">
                  <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] block">Stock Adjustments:</span>
                  <span className="font-mono font-bold text-sm text-[#111111] dark:text-[#FAFAFA]">
                    {checkData.stockAdjustmentCount}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Deactivating <strong>"{product.name}"</strong> will safely hide it from being added to any future orders while preserving all customer invoices, financial reports, and sales history.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ECECEC] dark:border-[#232323]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isDeactivating}
                className="text-xs rounded-xl border-[#ECECEC] dark:border-[#232323] min-h-[40px]"
              >
                Close
              </Button>
              {product.status === 'ACTIVE' && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onDeactivate(product.id)}
                  disabled={isDeactivating}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl min-h-[40px] px-4 shadow-xs gap-1.5"
                >
                  {isDeactivating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deactivating...
                    </>
                  ) : (
                    <>
                      <PackageX className="w-4 h-4" />
                      Deactivate Instead
                    </>
                  )}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
