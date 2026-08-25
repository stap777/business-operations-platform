import React from 'react';
import { Activity } from 'lucide-react';
import type { AuditLogResponse, PageResponse } from '../dashboard.types';

interface RecentActivityProps {
  data?: PageResponse<AuditLogResponse>;
  isLoading: boolean;
  isError: boolean;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ data, isLoading, isError }) => {
  const [activeCategory, setActiveCategory] = React.useState<'ALL' | 'ORDERS' | 'PAYMENTS' | 'INVENTORY' | 'CUSTOMERS'>('ALL');
  const rawLogs = data?.content ?? [];

  const logs = React.useMemo(() => {
    if (activeCategory === 'ALL') return rawLogs;
    return rawLogs.filter((log) => {
      const entity = (log.entityType || '').toUpperCase();
      const action = (log.action || '').toUpperCase();
      if (activeCategory === 'ORDERS') return entity === 'ORDER' || action.includes('ORDER');
      if (activeCategory === 'PAYMENTS') return entity === 'PAYMENT' || action.includes('PAYMENT');
      if (activeCategory === 'INVENTORY') return entity === 'PRODUCT' || entity === 'INVENTORY' || action.includes('STOCK');
      if (activeCategory === 'CUSTOMERS') return entity === 'CUSTOMER' || action.includes('CUSTOMER');
      return true;
    });
  }, [rawLogs, activeCategory]);

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const categories: { label: string; key: 'ALL' | 'ORDERS' | 'PAYMENTS' | 'INVENTORY' | 'CUSTOMERS' }[] = [
    { label: 'ALL', key: 'ALL' },
    { label: 'ORDERS', key: 'ORDERS' },
    { label: 'PAYMENTS', key: 'PAYMENTS' },
    { label: 'INVENTORY', key: 'INVENTORY' },
    { label: 'CUSTOMERS', key: 'CUSTOMERS' },
  ];

  return (
    <div className="p-5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#111111] dark:text-[#FAFAFA]">
            Activity Timeline (Audit Trail)
          </h2>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Real-time business audit trail (newest first)
          </p>
        </div>

        <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      </div>

      {/* Audit Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px] font-semibold">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-2.5 py-1 rounded-md transition-all shrink-0 uppercase tracking-wider text-[10px] ${
                isActive
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3 py-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-full bg-neutral-100 dark:bg-neutral-900 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="py-6 text-center">
          <p className="text-xs text-red-500 font-medium">Failed to load recent activity audit logs.</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-8 border border-dashed border-[#ECECEC] dark:border-[#232323] rounded-lg text-center">
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">No recent activity events recorded.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start justify-between gap-3 text-xs pb-3 border-b border-[#ECECEC] dark:border-[#232323] last:border-0 last:pb-0">
              <div className="space-y-0.5 min-w-0">
                <p className="font-semibold text-[#111111] dark:text-[#FAFAFA] truncate">
                  {log.remarks || `${log.action} on ${log.entityType}`}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                  <span className="font-medium text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.2 rounded text-[10px]">
                    {log.performedByName || 'System'}
                  </span>
                  <span className="uppercase font-mono text-[9px] tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                    {log.action}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono text-[#111111] dark:text-[#FAFAFA] font-semibold block">
                  {formatTime(log.performedAt)}
                </span>
                <span className="text-[9px] text-[#71717A] dark:text-[#A1A1AA] block">
                  {formatDate(log.performedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
