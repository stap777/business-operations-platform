import React, { useState } from 'react';
import { useAuditLogsReport } from '../hooks/useReports';
import { ShieldCheck, RefreshCw, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

export const AuditLogsReportView: React.FC = () => {
  const [page, setPage] = useState<number>(0);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');

  const {
    data: auditData,
    isLoading,
    isError,
    refetch,
  } = useAuditLogsReport({
    page,
    size: 15,
    entityType: entityTypeFilter || undefined,
  });

  const logs = auditData?.content || [];
  const totalPages = auditData?.totalPages || 0;
  const totalElements = auditData?.totalElements || 0;

  const handleEntityChange = (val: string) => {
    setEntityTypeFilter(val);
    setPage(0);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] p-3 rounded-xl shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#111111] dark:text-[#FAFAFA]">
          <ShieldCheck className="w-4 h-4 text-indigo-500" /> Administrative System Audit Log
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 text-xs text-[#71717A] dark:text-[#A1A1AA]">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={entityTypeFilter}
              onChange={(e) => handleEntityChange(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] text-xs text-[#111111] dark:text-[#FAFAFA] focus:outline-none cursor-pointer"
            >
              <option value="">All Entity Types</option>
              <option value="ORDER">Orders</option>
              <option value="INVOICE">Invoices</option>
              <option value="PRODUCT">Products</option>
              <option value="CUSTOMER">Customers</option>
              <option value="USER">Users</option>
              <option value="BUSINESS_SETTINGS">Business Settings</option>
              <option value="STOCK_ADJUSTMENT">Stock Adjustments</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-8 text-xs border-[#ECECEC] dark:border-[#232323] gap-1 text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading ? (
        <div className="h-64 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl animate-pulse" />
      ) : isError ? (
        <div className="p-8 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl space-y-3">
          <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
            Unable to load audit logs from server.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs gap-1.5 border-red-200 dark:border-red-800/50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </Button>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl space-y-2">
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">No audit logs recorded matching selected criteria.</p>
        </div>
      ) : (
        <div className="p-5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-4">
          <div className="overflow-x-auto border border-[#ECECEC] dark:border-[#232323] rounded-lg">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAFAFA] dark:bg-[#151515] border-b border-[#ECECEC] dark:border-[#232323] text-[#71717A] dark:text-[#A1A1AA] font-medium text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 font-mono">Timestamp</th>
                  <th className="py-2.5 px-3">Performed By</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity Type</th>
                  <th className="py-2.5 px-3 font-mono text-right">Entity ID</th>
                  <th className="py-2.5 px-3">Remarks / Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#151515]">
                    <td className="py-2.5 px-3 font-mono text-[#71717A] dark:text-[#A1A1AA] whitespace-nowrap">
                      {new Date(log.performedAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#111111] dark:text-[#FAFAFA]">
                      {log.performedByName || `User #${log.performedById}`}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#71717A] dark:text-[#A1A1AA] uppercase">
                      {log.entityType}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right text-[#71717A] dark:text-[#A1A1AA]">
                      {log.entityId ? `#${log.entityId}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-[#111111] dark:text-[#FAFAFA] max-w-xs truncate">
                      {log.remarks || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-[#71717A] dark:text-[#A1A1AA]">
              <div>
                Showing page <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{page + 1}</span> of{' '}
                <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{totalPages}</span> ({totalElements} logs)
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0 || isLoading}
                  onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                  className="h-8 text-xs font-medium gap-1 border-[#ECECEC] dark:border-[#232323]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1 || isLoading}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="h-8 text-xs font-medium gap-1 border-[#ECECEC] dark:border-[#232323]"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
