import React from 'react';
import type { InventoryReportResponse } from '../dashboard.types';
import { AlertTriangle } from 'lucide-react';

interface InventoryAlertProps {
  data?: InventoryReportResponse;
  isLoading: boolean;
  isError: boolean;
}

export const InventoryAlert: React.FC<InventoryAlertProps> = ({ data, isLoading, isError }) => {
  const lowStockItems = (data?.lowStockProducts ?? [])
    .slice()
    .sort((a, b) => (a.availableStock ?? 0) - (b.availableStock ?? 0));

  // Hide section completely if not loading and no items are low in stock
  if (!isLoading && !isError && lowStockItems.length === 0) {
    return null;
  }

  return (
    <div className="p-5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#111111] dark:text-[#FAFAFA] uppercase tracking-wide">
              Low Stock Alerts
            </h2>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Products below reorder threshold (Sorted lowest first)
            </p>
          </div>
        </div>

        {lowStockItems.length > 0 && (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold font-mono">
            {lowStockItems.length} LOW
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 py-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 w-full bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="py-4 text-center">
          <p className="text-xs text-rose-500 font-medium">Failed to load inventory alerts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {lowStockItems.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-lg bg-white dark:bg-[#0F0F0F] border border-amber-200 dark:border-amber-900/40 flex items-center justify-between shadow-2xs"
            >
              <div className="min-w-0 flex-1 pr-2">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                  LOW STOCK
                </span>
                <p className="text-xs font-bold text-[#111111] dark:text-[#FAFAFA] truncate mt-0.5">
                  {item.name}
                </p>
                {item.sku && (
                  <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-mono">
                    SKU: {item.sku}
                  </p>
                )}
              </div>

              <div className="text-right flex-shrink-0 pl-2 border-l border-neutral-200 dark:border-neutral-800">
                <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-medium block">
                  Remaining
                </span>
                <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                  {item.availableStock}
                </span>
                <span className="text-[9px] text-neutral-500 block">
                  Min: {item.minimumStock}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryAlert;
