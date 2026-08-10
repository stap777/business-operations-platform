import React from 'react';
import type { InventoryReportResponse } from '../report.types';
import { Boxes, AlertTriangle, XOctagon, DollarSign, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { useNavigate } from 'react-router-dom';

interface InventoryReportViewProps {
  data?: InventoryReportResponse;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export const InventoryReportView: React.FC<InventoryReportViewProps> = ({
  data,
  isLoading,
  isError,
  onRetry,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl animate-pulse p-4" />
          ))}
        </div>
        <div className="h-64 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl space-y-3">
        <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
          Unable to load inventory report from server.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="text-xs gap-1.5 border-red-200 dark:border-red-800/50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  const lowStockProducts = data?.lowStockProducts || [];
  const outOfStockProducts = data?.outOfStockProducts || [];
  const recentAdjustments = data?.recentAdjustments || [];

  const formatCurrency = (val: number = 0) => {
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Valuation & Stock Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-1">
          <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Total Inventory Valuation
          </span>
          <p className="text-xl font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
            {formatCurrency(data?.totalInventoryValuation)}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-1">
          <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1.5">
            <Boxes className="w-3.5 h-3.5 text-indigo-500" /> Total Active Products
          </span>
          <p className="text-xl font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
            {data?.totalProducts ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-1">
          <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Low Stock Products
          </span>
          <p className="text-xl font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
            {data?.totalLowStockCount ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-1">
          <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1.5">
            <XOctagon className="w-3.5 h-3.5 text-rose-500" /> Out of Stock Products
          </span>
          <p className="text-xl font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
            {data?.totalOutOfStockCount ?? 0}
          </p>
        </div>
      </div>

      {/* Low Stock Table Section */}
      <div className="p-5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA] flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Low Stock Inventory Items
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/inventory')}
            className="text-xs h-7 border-[#ECECEC] dark:border-[#232323] gap-1 text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA]"
          >
            <ExternalLink className="w-3 h-3" /> View Inventory
          </Button>
        </div>

        {lowStockProducts.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-[#ECECEC] dark:border-[#232323] rounded-lg">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              All product stock levels are healthy! No low-stock items detected.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#ECECEC] dark:border-[#232323] rounded-lg">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAFAFA] dark:bg-[#151515] border-b border-[#ECECEC] dark:border-[#232323] text-[#71717A] dark:text-[#A1A1AA] font-medium text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Available</th>
                  <th className="py-2.5 px-3 text-right">Minimum Threshold</th>
                  <th className="py-2.5 px-3 text-right">Selling Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
                {lowStockProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#151515]">
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#111111] dark:text-[#FAFAFA]">
                      {prod.sku}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#111111] dark:text-[#FAFAFA]">
                      {prod.name}
                    </td>
                    <td className="py-2.5 px-3 text-[#71717A] dark:text-[#A1A1AA]">
                      {prod.categoryName || 'Uncategorized'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                      {prod.availableStock} {prod.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#71717A] dark:text-[#A1A1AA]">
                      {prod.minimumStock} {prod.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#111111] dark:text-[#FAFAFA]">
                      {formatCurrency(prod.sellingPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Out of Stock Table Section */}
      {outOfStockProducts.length > 0 && (
        <div className="p-5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-[#0F0F0F] space-y-3">
          <h3 className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <XOctagon className="w-3.5 h-3.5" /> Out of Stock Products ({outOfStockProducts.length})
          </h3>
          <div className="overflow-x-auto border border-[#ECECEC] dark:border-[#232323] rounded-lg">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-rose-50/50 dark:bg-rose-950/20 border-b border-[#ECECEC] dark:border-[#232323] text-rose-600 dark:text-rose-400 font-medium text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Available</th>
                  <th className="py-2.5 px-3 text-right">Selling Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
                {outOfStockProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-rose-50/30 dark:hover:bg-rose-950/10">
                    <td className="py-2.5 px-3 font-mono font-semibold text-rose-600 dark:text-rose-400">
                      {prod.sku}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#111111] dark:text-[#FAFAFA]">
                      {prod.name}
                    </td>
                    <td className="py-2.5 px-3 text-[#71717A] dark:text-[#A1A1AA]">
                      {prod.categoryName || 'Uncategorized'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      0 {prod.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#111111] dark:text-[#FAFAFA]">
                      {formatCurrency(prod.sellingPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustments Section */}
      {recentAdjustments.length > 0 && (
        <div className="p-5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-3">
          <h3 className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA]">
            Recent Stock Adjustments
          </h3>
          <div className="overflow-x-auto border border-[#ECECEC] dark:border-[#232323] rounded-lg">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAFAFA] dark:bg-[#151515] border-b border-[#ECECEC] dark:border-[#232323] text-[#71717A] dark:text-[#A1A1AA] font-medium text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Qty Change</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Performed By</th>
                  <th className="py-2.5 px-3 font-mono">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
                {recentAdjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#151515]">
                    <td className="py-2.5 px-3 font-medium text-[#111111] dark:text-[#FAFAFA]">
                      {adj.productName}
                    </td>
                    <td className="py-2.5 px-3 font-mono uppercase text-[#71717A] dark:text-[#A1A1AA]">
                      {adj.adjustmentType}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                      adj.quantityChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {adj.quantityChange >= 0 ? `+${adj.quantityChange}` : adj.quantityChange}
                    </td>
                    <td className="py-2.5 px-3 text-[#71717A] dark:text-[#A1A1AA]">
                      {adj.reason || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#111111] dark:text-[#FAFAFA]">
                      {adj.performedByName}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#71717A] dark:text-[#A1A1AA]">
                      {new Date(adj.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
