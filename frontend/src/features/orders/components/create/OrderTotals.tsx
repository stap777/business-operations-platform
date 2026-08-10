import React from 'react';

interface OrderTotalsProps {
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
}

export const OrderTotals: React.FC<OrderTotalsProps> = ({
  subtotal,
  discountAmount,
  totalAmount,
}) => {
  return (
    <div className="p-4 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-2 text-xs shadow-sm">
      <div className="flex items-center justify-between text-[#71717A] dark:text-[#A1A1AA]">
        <span>Subtotal</span>
        <span className="font-mono text-[#111111] dark:text-[#FAFAFA]">
          ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {discountAmount > 0 && (
        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
          <span>Discount</span>
          <span className="font-mono">
            -₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      <div className="pt-2 border-t border-[#ECECEC] dark:border-[#232323] flex items-center justify-between font-bold text-sm text-[#111111] dark:text-[#FAFAFA]">
        <span>Total</span>
        <span className="font-mono text-base">
          ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
};
