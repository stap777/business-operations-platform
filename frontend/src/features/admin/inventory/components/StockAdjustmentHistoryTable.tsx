import React from 'react';
import type { StockAdjustmentResponse } from '../inventory.types';

interface StockAdjustmentHistoryTableProps {
  adjustments: StockAdjustmentResponse[];
  isLoading: boolean;
}

export const StockAdjustmentHistoryTable: React.FC<StockAdjustmentHistoryTableProps> = ({
  adjustments,
  isLoading,
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

  if (adjustments.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl p-12 text-center shadow-sm">
        <h3 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">No stock adjustment history yet</h3>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1 max-w-sm mx-auto">
          Stock adjustments recorded for products will appear in this audit log.
        </p>
      </div>
    );
  }

  const formatAdjustmentType = (type: string) => {
    switch (type) {
      case 'IN':
        return <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">+ Add</span>;
      case 'OUT':
        return <span className="text-xs font-medium text-rose-600 dark:text-rose-400">- Remove</span>;
      case 'DAMAGED':
        return <span className="text-xs font-medium text-amber-600 dark:text-amber-400">- Damaged</span>;
      case 'CORRECTION':
        return <span className="text-xs font-medium text-blue-600 dark:text-blue-400">+ Audit</span>;
      default:
        return <span className="text-xs font-medium text-[#71717A]">{type}</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA]/50 dark:bg-[#151515]/50 text-[#71717A] dark:text-[#A1A1AA] font-medium text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4 text-right">Quantity</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4">Reference</th>
              <th className="py-3 px-4">Adjusted By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
            {adjustments.map((adj) => (
              <tr
                key={adj.id}
                className="hover:bg-[#FAFAFA] dark:hover:bg-[#151515] transition-colors"
              >
                <td className="py-3.5 px-4 font-mono text-[#71717A] dark:text-[#A1A1AA]">
                  {new Date(adj.adjustmentDate).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </td>
                <td className="py-3.5 px-4 font-medium text-[#111111] dark:text-[#FAFAFA]">
                  {adj.productName}
                </td>
                <td className="py-3.5 px-4">
                  {formatAdjustmentType(adj.adjustmentType)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#111111] dark:text-[#FAFAFA]">
                  {adj.adjustmentType === 'IN' || adj.adjustmentType === 'CORRECTION' ? `+${adj.quantity}` : `-${adj.quantity}`}
                </td>
                <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA] max-w-xs truncate" title={adj.reason}>
                  {adj.reason}
                </td>
                <td className="py-3.5 px-4 font-mono text-[#71717A] dark:text-[#A1A1AA]">
                  {adj.referenceNumber || '—'}
                </td>
                <td className="py-3.5 px-4 text-[#111111] dark:text-[#FAFAFA]">
                  {adj.adjustedByName || `User #${adj.adjustedById}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
