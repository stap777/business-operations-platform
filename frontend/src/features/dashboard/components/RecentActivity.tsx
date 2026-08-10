import React from 'react';
import { Activity, ShieldAlert } from 'lucide-react';
import type { AuditLogResponse, PageResponse } from '../dashboard.types';
import { useAuth } from '../../../context/AuthContext';

interface RecentActivityProps {
  data?: PageResponse<AuditLogResponse>;
  isLoading: boolean;
  isError: boolean;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ data, isLoading, isError }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const logs = data?.content ?? [];

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">
            Recent Activity
          </h2>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Real-time audit log event stream
          </p>
        </div>

        <Activity className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
      </div>

      {!isAdmin ? (
        <div className="py-6 border border-dashed border-[#ECECEC] dark:border-[#232323] rounded-lg text-center flex flex-col items-center justify-center p-4">
          <ShieldAlert className="w-5 h-5 text-[#71717A] dark:text-[#A1A1AA] mb-1.5" />
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Audit logs are restricted to System Administrators.
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3 py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-full bg-neutral-100 dark:bg-neutral-900 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="py-6 text-center">
          <p className="text-xs text-red-500 font-medium">Failed to load recent activity logs.</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-8 border border-dashed border-[#ECECEC] dark:border-[#232323] rounded-lg text-center">
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">No recent activity events recorded.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start justify-between gap-3 text-xs pb-2.5 border-b border-[#ECECEC] dark:border-[#232323] last:border-0 last:pb-0">
              <div className="space-y-0.5">
                <p className="font-medium text-[#111111] dark:text-[#FAFAFA]">
                  {log.remarks || `${log.action} on ${log.entityType}`}
                </p>
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                  By {log.performedByName || 'System'}
                </p>
              </div>
              <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] flex-shrink-0">
                {formatTime(log.performedAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
