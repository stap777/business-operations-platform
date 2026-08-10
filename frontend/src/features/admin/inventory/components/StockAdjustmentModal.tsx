import React, { useState, useEffect } from 'react';
import type { ProductResponse } from '../../../products/product.types';
import type { StockAdjustmentRequest, StockAdjustmentType } from '../inventory.types';
import { Button } from '../../../../components/ui/button';
import { X, Loader2, ArrowRight } from 'lucide-react';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StockAdjustmentRequest) => void;
  isSubmitting: boolean;
  products: ProductResponse[];
  selectedProduct?: ProductResponse | null;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  products,
  selectedProduct,
}) => {
  const [productId, setProductId] = useState<number | ''>('');
  const [adjustmentType, setAdjustmentType] = useState<StockAdjustmentType>('IN');
  const [quantity, setQuantity] = useState<string>('10');
  const [reason, setReason] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProduct) {
      setProductId(selectedProduct.id);
    } else if (products.length > 0 && !productId) {
      setProductId(products[0].id);
    }
    setAdjustmentType('IN');
    setQuantity('10');
    setReason('');
    setReferenceNumber('');
    setErrorMsg(null);
  }, [selectedProduct, isOpen, products]);

  if (!isOpen) return null;

  const currentProd = products.find((p) => p.id === Number(productId)) || selectedProduct;
  const currentStock = currentProd?.availableStock ?? 0;
  const qtyNum = parseInt(quantity, 10) || 0;

  // Calculate new preview stock
  let newStockPreview = currentStock;
  if (adjustmentType === 'IN' || adjustmentType === 'CORRECTION') {
    newStockPreview = currentStock + qtyNum;
  } else if (adjustmentType === 'OUT' || adjustmentType === 'DAMAGED') {
    newStockPreview = currentStock - qtyNum;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!productId) {
      setErrorMsg('Please select a product for stock adjustment.');
      return;
    }

    if (qtyNum <= 0) {
      setErrorMsg('Adjustment quantity must be greater than 0.');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Reason for stock adjustment is required.');
      return;
    }

    if ((adjustmentType === 'OUT' || adjustmentType === 'DAMAGED') && newStockPreview < 0) {
      setErrorMsg(
        `Insufficient stock! Reduction of ${qtyNum} exceeds current stock of ${currentStock}.`
      );
      return;
    }

    const payload: StockAdjustmentRequest = {
      productId: Number(productId),
      adjustmentType,
      quantity: qtyNum,
      reason: reason.trim(),
      referenceNumber: referenceNumber.trim() || undefined,
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#ECECEC] dark:border-[#232323]">
          <div>
            <h2 className="text-base font-semibold text-[#111111] dark:text-[#FAFAFA]">
              Adjust Stock
            </h2>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              Record an inventory adjustment entry.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-xs text-red-600 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Target Product */}
          <div>
            <label className="font-medium text-[#111111] dark:text-[#FAFAFA] block mb-1">
              Product
            </label>
            {selectedProduct ? (
              <div className="p-2.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] font-medium text-[#111111] dark:text-[#FAFAFA] flex items-center justify-between">
                <span>{selectedProduct.name}</span>
                <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                  Current: {selectedProduct.availableStock} {selectedProduct.unit}
                </span>
              </div>
            ) : (
              <select
                value={productId}
                onChange={(e) => setProductId(Number(e.target.value))}
                required
                className="w-full p-2 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] text-[#111111] dark:text-[#FAFAFA]"
              >
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Stock: {p.availableStock} {p.unit}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Adjustment Type & Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#111111] dark:text-[#FAFAFA] block mb-1">
                Adjustment Type
              </label>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as StockAdjustmentType)}
                className="w-full p-2 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] text-[#111111] dark:text-[#FAFAFA]"
              >
                <option value="IN">Add (+ In)</option>
                <option value="OUT">Remove (- Out)</option>
                <option value="DAMAGED">Damaged (- Removal)</option>
                <option value="CORRECTION">Audit (+ Correction)</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-[#111111] dark:text-[#FAFAFA] block mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="10"
                required
                className="w-full p-2 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] text-[#111111] dark:text-[#FAFAFA] font-mono"
              />
            </div>
          </div>

          {/* Quiet Stock Preview Row */}
          {currentProd && (
            <div className="py-2 px-3 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] flex items-center justify-between text-xs">
              <span className="text-[#71717A] dark:text-[#A1A1AA]">
                Current: <strong className="text-[#111111] dark:text-[#FAFAFA] font-mono">{currentStock}</strong> {currentProd.unit}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#71717A]" />
              <span className="text-[#71717A] dark:text-[#A1A1AA]">
                New: <strong className={`font-mono ${newStockPreview < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{newStockPreview}</strong> {currentProd.unit}
              </span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="font-medium text-[#111111] dark:text-[#FAFAFA] block mb-1">
              Reason
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for stock adjustment..."
              maxLength={500}
              required
              className="w-full p-2 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A]"
            />
          </div>

          {/* Reference Number */}
          <div>
            <label className="font-medium text-[#111111] dark:text-[#FAFAFA] block mb-1">
              Reference # (Optional)
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. PO-98421"
              maxLength={50}
              className="w-full p-2 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] text-[#111111] dark:text-[#FAFAFA] font-mono"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ECECEC] dark:border-[#232323]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-8 border-[#ECECEC] dark:border-[#232323]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || newStockPreview < 0}
              size="sm"
              className="bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] hover:opacity-90 text-xs font-medium h-8 px-4"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Adjusting...
                </span>
              ) : (
                'Adjust Stock'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
