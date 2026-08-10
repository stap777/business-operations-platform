import React from 'react';
import type { InventoryReportResponse } from '../dashboard.types';

interface InventoryAlertProps {
  data?: InventoryReportResponse;
  isLoading: boolean;
  isError: boolean;
}

export const InventoryAlert: React.FC<InventoryAlertProps> = ({ data, isLoading, isError }) => {
  const lowStockItems = data?.lowStockProducts ?? [];

  return (
    <div className="p-5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">
            Low Stock Alerts
          </h2>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Products at or below reorder thresholds
          </p>
        </div>

        {lowStockItems.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-medium">
            {lowStockItems.length} Low
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2 py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-full bg-neutral-100 dark:bg-neutral-900 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="py-6 text-center">
          <p className="text-xs text-red-500 font-medium">Failed to load inventory alerts.</p>
        </div>
      ) : lowStockItems.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-[#ECECEC] dark:border-[#232323] rounded-lg">
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">All inventory levels are optimal.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#ECECEC] dark:border-[#232323] text-[#71717A] dark:text-[#A1A1AA]">
                <th className="pb-2 font-medium">Product</th>
                <th className="pb-2 font-medium text-right">Available</th>
                <th className="pb-2 font-medium text-right">Reorder Level</th>
                <th className="pb-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
              {lowStockItems.slice(0, 5).map((item) => (
                <tr key={item.id} className="text-[#111111] dark:text-[#FAFAFA]">
                  <td className="py-2.5 font-medium truncate max-w-[140px]">
                    {item.name}
                    <span className="block text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-normal">{item.sku}</span>
                  </td>
                  <td className="py-2.5 text-right font-semibold text-amber-600 dark:text-amber-400">
                    {item.availableStock}
                  </td>
                  <td className="py-2.5 text-right text-[#71717A] dark:text-[#A1A1AA]">
                    {item.minimumStock}
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase">
                      Low
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
