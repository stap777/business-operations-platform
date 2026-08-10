import React from 'react';
import type { DeliveryReportResponse } from '../report.types';
import { Truck, CheckCircle2, Clock, Users, RefreshCw } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

interface DeliveryReportViewProps {
  data?: DeliveryReportResponse;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export const DeliveryReportView: React.FC<DeliveryReportViewProps> = ({
  data,
  isLoading,
  isError,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl animate-pulse p-4" />
          ))}
        </div>
        <div className="h-48 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl space-y-3">
        <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
          Unable to load delivery report from server.
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

  const agentList = data?.agentPerformanceList || [];
  const deliveriesToday = data?.deliveriesToday || 0;
  const completed = data?.completedDeliveries || 0;
  const pending = data?.pendingDeliveries || 0;
  const completionRate = deliveriesToday > 0 ? Math.round((completed / deliveriesToday) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-1">
          <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-indigo-500" /> Total Deliveries Today
          </span>
          <p className="text-xl font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
            {deliveriesToday}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-1">
          <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Completed
          </span>
          <p className="text-xl font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
            {completed}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-1">
          <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending / Out for Delivery
          </span>
          <p className="text-xl font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
            {pending}
          </p>
        </div>
      </div>

      {/* Delivery Completion Progress Card */}
      <div className="p-5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA]">
            Daily Operational Fulfillment Rate
          </h3>
          <span className="text-xs font-mono font-bold text-[#111111] dark:text-[#FAFAFA]">
            {completionRate}% Completed
          </span>
        </div>

        <div className="w-full bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] h-3 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
            title={`Completed: ${completed}`}
          />
          <div
            className="bg-amber-500 h-full transition-all duration-300"
            style={{ width: `${100 - completionRate}%` }}
            title={`Pending: ${pending}`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#71717A] dark:text-[#A1A1AA] font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Completed ({completed})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Pending ({pending})
          </span>
        </div>
      </div>

      {/* Agent Performance Table */}
      <div className="p-5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-3">
        <h3 className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA] flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-indigo-500" /> Delivery Agent Performance
        </h3>

        {agentList.length === 0 ? (
          <p className="text-xs text-[#71717A] text-center py-4">No active delivery assignments recorded today.</p>
        ) : (
          <div className="overflow-x-auto border border-[#ECECEC] dark:border-[#232323] rounded-lg">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAFAFA] dark:bg-[#151515] border-b border-[#ECECEC] dark:border-[#232323] text-[#71717A] dark:text-[#A1A1AA] font-medium text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Agent Name</th>
                  <th className="py-2.5 px-3 text-right">Total Assigned</th>
                  <th className="py-2.5 px-3 text-right">Pending</th>
                  <th className="py-2.5 px-3 text-right">Completed</th>
                  <th className="py-2.5 px-3 text-right">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
                {agentList.map((agent, idx) => {
                  const rate = agent.totalAssigned > 0 ? Math.round((agent.completedDeliveries / agent.totalAssigned) * 100) : 0;

                  return (
                    <tr key={agent.deliveryPersonId || idx} className="hover:bg-[#FAFAFA] dark:hover:bg-[#151515]">
                      <td className="py-2.5 px-3 font-medium text-[#111111] dark:text-[#FAFAFA]">
                        {agent.deliveryPersonName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#111111] dark:text-[#FAFAFA]">
                        {agent.totalAssigned}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-600 dark:text-amber-400">
                        {agent.pendingDeliveries}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        {agent.completedDeliveries}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#71717A] dark:text-[#A1A1AA]">
                        {rate}%
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
