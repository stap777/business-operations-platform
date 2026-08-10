import React from 'react';
import type { SalesReportResponse } from '../dashboard.types';

interface SalesOverviewProps {
  data?: SalesReportResponse;
  granularity: string;
  onGranularityChange: (val: string) => void;
  isLoading: boolean;
  isError: boolean;
}

export const SalesOverview: React.FC<SalesOverviewProps> = ({
  data,
  granularity,
  onGranularityChange,
  isLoading,
  isError,
}) => {
  const items = data?.items ?? [];

  // Calculate chart dimensions and points dynamically from real backend response
  const maxRevenue = Math.max(...items.map((i) => i.revenue || 0), 100);

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val}`;
  };

  return (
    <div className="p-5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">
            Sales Overview
          </h2>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Real-time revenue performance breakdown
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={granularity}
            onChange={(e) => onGranularityChange(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] text-xs text-[#111111] dark:text-[#FAFAFA] focus:outline-none cursor-pointer"
          >
            <option value="DAILY">Daily Breakdown</option>
            <option value="WEEKLY">Weekly Breakdown</option>
            <option value="MONTHLY">Monthly Breakdown</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 w-full bg-neutral-100 dark:bg-neutral-900/50 rounded-lg animate-pulse flex items-center justify-center">
          <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Loading sales analytics...</span>
        </div>
      ) : isError ? (
        <div className="h-64 w-full rounded-lg border border-dashed border-[#ECECEC] dark:border-[#232323] flex flex-col items-center justify-center p-4 text-center">
          <p className="text-xs text-red-500 font-medium">Unable to load sales report from server.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="h-64 w-full rounded-lg border border-dashed border-[#ECECEC] dark:border-[#232323] flex flex-col items-center justify-center p-4 text-center">
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">No sales records found for this period.</p>
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          {/* Data-Driven Responsive SVG Chart */}
          <div className="relative h-56 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
                <line
                  key={idx}
                  x1="0"
                  y1={180 * ratio}
                  x2="500"
                  y2={180 * ratio}
                  stroke="currentColor"
                  className="text-neutral-200 dark:text-neutral-800"
                  strokeDasharray="3 3"
                />
              ))}

              {/* Real Data Area & Path */}
              {(() => {
                const points = items.map((item, index) => {
                  const x = (index / (items.length - 1 || 1)) * 500;
                  const y = 180 - ((item.revenue || 0) / maxRevenue) * 160;
                  return { x, y, item };
                });

                const pathString = points
                  .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                  .join(' ');

                const areaString = `${pathString} L 500 180 L 0 180 Z`;

                return (
                  <>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" className="text-neutral-800 dark:text-neutral-200" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-neutral-800 dark:text-neutral-200" />
                      </linearGradient>
                    </defs>

                    <path d={areaString} fill="url(#salesGrad)" />
                    <path
                      d={pathString}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-[#111111] dark:text-[#FAFAFA]"
                    />

                    {points.map((p, idx) => (
                      <g key={idx} className="group cursor-pointer">
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          className="fill-white dark:fill-[#0F0F0F] stroke-[#111111] dark:stroke-[#FAFAFA] stroke-2"
                        />
                        <title>{`${p.item.periodLabel}: ${formatCurrency(p.item.revenue || 0)} (${p.item.totalOrders || 0} orders)`}</title>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>

          {/* Period Labels */}
          <div className="flex justify-between items-center text-[10px] text-[#71717A] dark:text-[#A1A1AA] pt-1">
            {items.map((item, idx) => (
              <span key={idx} className="truncate max-w-[60px] text-center">
                {item.periodLabel}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
