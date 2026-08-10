import React from 'react';
import type { DeliveryReportResponse } from '../dashboard.types';

interface DeliveryOverviewProps {
  data?: DeliveryReportResponse;
  isLoading: boolean;
  isError: boolean;
}

export const DeliveryOverview: React.FC<DeliveryOverviewProps> = ({ data, isLoading, isError }) => {
  const total = data?.deliveriesToday ?? 0;
  const completed = data?.completedDeliveries ?? 0;
  const pending = data?.pendingDeliveries ?? 0;

  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0;

  return (
    <div className="p-5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-4 flex flex-col justify-between">
      <div>
        <h2 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">
          Delivery Overview
        </h2>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
          Today's operational delivery metrics
        </p>
      </div>

      {isLoading ? (
        <div className="h-44 w-full bg-neutral-100 dark:bg-neutral-900/50 rounded-lg animate-pulse flex items-center justify-center">
          <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Loading delivery metrics...</span>
        </div>
      ) : isError ? (
        <div className="h-44 w-full rounded-lg border border-dashed border-[#ECECEC] dark:border-[#232323] flex items-center justify-center text-center p-4">
          <p className="text-xs text-red-500 font-medium">Unable to load delivery status.</p>
        </div>
      ) : total === 0 ? (
        <div className="h-44 w-full rounded-lg border border-dashed border-[#ECECEC] dark:border-[#232323] flex flex-col items-center justify-center p-4 text-center">
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">No delivery activity recorded today.</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
          {/* Donut Chart */}
          <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-neutral-100 dark:text-neutral-900 stroke-current"
                strokeWidth="3.8"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#111111] dark:text-[#FAFAFA] stroke-current"
                strokeDasharray={`${completedPct}, 100`}
                strokeWidth="3.8"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xl font-bold text-[#111111] dark:text-[#FAFAFA]">{total}</span>
              <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">Total</span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2.5 w-full text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#111111] dark:bg-[#FAFAFA]" />
                <span className="text-[#111111] dark:text-[#FAFAFA] font-medium">Completed</span>
              </div>
              <span className="text-[#71717A] dark:text-[#A1A1AA]">{completed} ({completedPct}%)</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                <span className="text-[#111111] dark:text-[#FAFAFA] font-medium">Pending</span>
              </div>
              <span className="text-[#71717A] dark:text-[#A1A1AA]">{pending} ({pendingPct}%)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
