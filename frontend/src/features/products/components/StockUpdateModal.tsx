import React, { useState, useEffect } from 'react';
import type { ProductResponse } from '../product.types';
import { useUpdateStock } from '../hooks/useProducts';
import { Button } from '../../../components/ui/button';
import { Boxes, X, AlertCircle } from 'lucide-react';

interface StockUpdateModalProps {
  product: ProductResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StockUpdateModal: React.FC<StockUpdateModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const [stockInput, setStockInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateStockMutation = useUpdateStock();

  useEffect(() => {
    if (product) {
      setStockInput(product.availableStock.toString());
      setErrorMessage(null);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedStock = parseInt(stockInput, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      setErrorMessage('Stock count must be a non-negative integer (0 or greater).');
      return;
    }

    updateStockMutation.mutate(
      { id: product.id, availableStock: parsedStock },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#ECECEC] dark:border-[#232323]">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-purple-500" />
            <h2 className="text-sm font-bold text-[#111111] dark:text-[#FAFAFA]">
              Adjust Stock Level
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Details Header */}
        <div className="bg-[#FAFAFA] dark:bg-[#151515] p-3.5 border-b border-[#ECECEC] dark:border-[#232323] space-y-1 text-xs">
          <div className="font-semibold text-[#111111] dark:text-[#FAFAFA]">
            {product.name}
          </div>
          <div className="flex justify-between text-[#71717A] dark:text-[#A1A1AA] font-mono">
            <span>SKU: {product.sku || 'N/A'}</span>
            <span>Current Stock: <strong className="text-[#111111] dark:text-[#FAFAFA]">{product.availableStock}</strong></span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="m-3.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          <div className="space-y-1">
            <label className="block font-medium text-[#111111] dark:text-[#FAFAFA]">
              New Available Stock Count <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={stockInput}
              onChange={(e) => setStockInput(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-sm font-mono font-bold text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs border-[#ECECEC] dark:border-[#232323]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateStockMutation.isPending}
              className="text-xs font-semibold bg-[#111111] text-white dark:bg-[#FAFAFA] dark:text-[#111111]"
            >
              {updateStockMutation.isPending ? 'Updating...' : 'Update Stock'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
