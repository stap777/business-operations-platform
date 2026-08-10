import React from 'react';
import type { SalesReportResponse } from '../report.types';
import {
  RefreshCw,
  TrendingUp,
  ShoppingBag,
  Tag,
  PiggyBank,
  Percent,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';

interface SalesReportViewProps {
  data?: SalesReportResponse;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export const SalesReportView: React.FC<SalesReportViewProps> = ({
  data,
  isLoading,
  isError,
  onRetry,
}) => {
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
          Unable to load sales & profit report from server.
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

  const items = data?.items || [];
  const maxRevenue = Math.max(...items.map((i) => i.revenue || 0), 100);

  const grossProfit = data?.grossProfit ?? 0;
  const isProfitable = grossProfit >= 0;

  const formatCurrency = (val: number = 0) => {
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Legacy Order COGS Notice */}
      {data?.cogsIncomplete && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            <strong>Notice:</strong> This report range includes legacy order items created prior to purchase cost snapshotting. Unrecorded legacy purchase costs are excluded from COGS calculations.
          </span>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Revenue */}
        <div className="p-3.5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-1">
          <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" /> Revenue
          </span>
          <p className="text-base font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
            {formatCurrency(data?.totalRevenue)}
          </p>
        </div>

        {/* Cost of Goods Sold (COGS) */}
        <div className="p-3.5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-1">
          <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1">
            <Coins className="w-3 h-3 text-indigo-500" /> Cost (COGS)
          </span>
          <p className="text-base font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
            {formatCurrency(data?.totalCogs)}
          </p>
        </div>

        {/* Gross Profit */}
        <div className={`p-3.5 rounded-xl border bg-white dark:bg-[#0F0F0F] space-y-1 ${
          isProfitable
            ? 'border-emerald-200 dark:border-emerald-900/40'
            : 'border-rose-200 dark:border-rose-900/40'
        }`}>
          <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1">
            <PiggyBank className={`w-3 h-3 ${isProfitable ? 'text-emerald-500' : 'text-rose-500'}`} /> Gross Profit
          </span>
          <p className={`text-base font-bold font-mono ${isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(data?.grossProfit)}
          </p>
        </div>

        {/* Profit Margin % */}
        <div className="p-3.5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-1">
          <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1">
            <Percent className="w-3 h-3 text-purple-500" /> Margin %
          </span>
          <p className="text-base font-bold font-mono text-[#111111] dark:text-[#FAFAFA] flex items-center gap-0.5">
            {data?.profitMarginPercentage?.toFixed(2) ?? '0.00'}%
            {isProfitable ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 inline" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 inline" />
            )}
          </p>
        </div>

        {/* Total Orders */}
        <div className="p-3.5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-1">
          <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1">
            <ShoppingBag className="w-3 h-3 text-blue-500" /> Orders
          </span>
          <p className="text-base font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
            {data?.totalOrders ?? 0}
          </p>
        </div>

        {/* Total Discounts */}
        <div className="p-3.5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-1">
          <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1">
            <Tag className="w-3 h-3 text-amber-500" /> Discounts
          </span>
          <p className="text-base font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
            {formatCurrency(data?.totalDiscountGiven)}
          </p>
        </div>

        {/* Avg Order Value */}
        <div className="p-3.5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-1">
          <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider">
            Avg Order
          </span>
          <p className="text-base font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
            {formatCurrency(data?.averageOrderValue)}
          </p>
        </div>
      </div>

      {/* Profit & Loss Financial Summary Card */}
      <div className="p-5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#111111] dark:text-[#FAFAFA] flex items-center gap-1.5">
              <PiggyBank className="w-4 h-4 text-emerald-500" />
              Profit & Loss (P&L) Summary Statement
            </h3>
            <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
              Calculated dynamically from real product cost prices and non-cancelled order line items
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-3.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] space-y-1">
            <span className="text-[10px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase">Gross Revenue</span>
            <p className="text-lg font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
              {formatCurrency(data?.totalRevenue)}
            </p>
            <p className="text-[10px] text-[#71717A]">Total order invoice value</p>
          </div>

          <div className="p-3.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] space-y-1">
            <span className="text-[10px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase">Cost of Goods Sold (COGS)</span>
            <p className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">
              - {formatCurrency(data?.totalCogs)}
            </p>
            <p className="text-[10px] text-[#71717A]">Sum of item acquisition costs</p>
          </div>

          <div className={`p-3.5 rounded-lg border space-y-1 ${
            isProfitable
              ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20'
              : 'border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20'
          }`}>
            <span className="text-[10px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase">Net Gross Profit</span>
            <p className={`text-lg font-bold font-mono ${
              isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              = {formatCurrency(data?.grossProfit)}
            </p>
            <p className="text-[10px] text-[#71717A]">Margin: {data?.profitMarginPercentage?.toFixed(2) ?? '0.00'}%</p>
          </div>
        </div>
      </div>

      {/* Revenue Trend SVG Line Chart */}
      <div className="p-5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA]">
              Revenue & Profit Trend ({data?.granularity || 'DAILY'})
            </h3>
            <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
              Periodic aggregate sales performance from backend database
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="h-44 w-full rounded-lg border border-dashed border-[#ECECEC] dark:border-[#232323] flex items-center justify-center p-4 text-center">
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">No sales records found for this period.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative h-44 w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160" preserveAspectRatio="none">
                {[0, 0.33, 0.66, 1].map((ratio, idx) => (
                  <line
                    key={idx}
                    x1="0"
                    y1={160 * ratio}
                    x2="500"
                    y2={160 * ratio}
                    stroke="currentColor"
                    className="text-neutral-200 dark:text-neutral-800"
                    strokeDasharray="3 3"
                  />
                ))}

                {(() => {
                  const points = items.map((item, index) => {
                    const x = (index / (items.length - 1 || 1)) * 500;
                    const y = 160 - ((item.revenue || 0) / maxRevenue) * 140;
                    return { x, y, item };
                  });

                  const pathString = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                  const areaString = `${pathString} L 500 160 L 0 160 Z`;

                  return (
                    <>
                      <defs>
                        <linearGradient id="salesGradReports" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" className="text-[#111111] dark:text-[#FAFAFA]" />
                          <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-[#111111] dark:text-[#FAFAFA]" />
                        </linearGradient>
                      </defs>

                      <path d={areaString} fill="url(#salesGradReports)" />
                      <path
                        d={pathString}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-[#111111] dark:text-[#FAFAFA]"
                      />

                      {points.map((p, idx) => (
                        <g key={idx}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="3.5"
                            className="fill-white dark:fill-[#0F0F0F] stroke-[#111111] dark:stroke-[#FAFAFA] stroke-2"
                          />
                          <title>{`${p.item.periodLabel}: Revenue ₹${p.item.revenue?.toFixed(2)}, Gross Profit ₹${p.item.grossProfit?.toFixed(2)}`}</title>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>

            <div className="flex justify-between items-center text-[10px] text-[#71717A] dark:text-[#A1A1AA] pt-1">
              {items.map((item, idx) => (
                <span key={idx} className="truncate max-w-[60px] text-center font-mono">
                  {item.periodLabel}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Breakdown Data Table */}
      <div className="p-5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-3">
        <h3 className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA]">
          Periodic Sales & Profit Breakdown
        </h3>

        {items.length === 0 ? (
          <p className="text-xs text-[#71717A] text-center py-4">No breakdown data available.</p>
        ) : (
          <div className="overflow-x-auto border border-[#ECECEC] dark:border-[#232323] rounded-lg">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAFAFA] dark:bg-[#151515] border-b border-[#ECECEC] dark:border-[#232323] text-[#71717A] dark:text-[#A1A1AA] font-medium text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3 text-right">Orders</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                  <th className="py-2.5 px-3 text-right">Cost (COGS)</th>
                  <th className="py-2.5 px-3 text-right">Gross Profit</th>
                  <th className="py-2.5 px-3 text-right">Margin %</th>
                  <th className="py-2.5 px-3 text-right">Discount</th>
                  <th className="py-2.5 px-3 text-right">Avg Order</th>
                  <th className="py-2.5 px-3 text-right">Completed</th>
                  <th className="py-2.5 px-3 text-right">Cancelled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
                {items.map((item, idx) => {
                  const itemProfit = item.grossProfit ?? 0;
                  const isItemProfitable = itemProfit >= 0;

                  return (
                    <tr key={idx} className="hover:bg-[#FAFAFA] dark:hover:bg-[#151515]">
                      <td className="py-2.5 px-3 font-mono font-medium text-[#111111] dark:text-[#FAFAFA]">
                        {item.periodLabel}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#111111] dark:text-[#FAFAFA]">
                        {item.totalOrders}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#111111] dark:text-[#FAFAFA]">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(item.cogs)}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                        isItemProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {formatCurrency(item.grossProfit)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#71717A] dark:text-[#A1A1AA]">
                        {item.profitMarginPercentage?.toFixed(2) ?? '0.00'}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-600 dark:text-amber-400">
                        {formatCurrency(item.discountGiven)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#71717A] dark:text-[#A1A1AA]">
                        {formatCurrency(item.averageOrderValue)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        {item.completedOrders}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                        {item.cancelledOrders}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
