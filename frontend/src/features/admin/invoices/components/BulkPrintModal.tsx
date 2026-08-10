import React from 'react';
import { Button } from '../../../../components/ui/button';
import { Printer, AlertTriangle, Loader2, X } from 'lucide-react';

interface BulkPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalCount: number;
  isPreparing: boolean;
  loadedCount: number;
  errorMessage: string | null;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}

export const BulkPrintModal: React.FC<BulkPrintModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalCount,
  isPreparing,
  loadedCount,
  errorMessage,
  searchQuery,
  startDate,
  endDate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#ECECEC] dark:border-[#232323]">
          <div className="flex items-center gap-2 text-[#111111] dark:text-[#FAFAFA]">
            <Printer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold">Print all matching invoices?</h3>
          </div>
          {!isPreparing && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body */}
        {errorMessage ? (
          <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-xs space-y-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Unable to prepare all invoices for printing.</span>
            </div>
            <p className="text-red-600 dark:text-red-400 text-[11px]">
              {errorMessage}
            </p>
          </div>
        ) : isPreparing ? (
          <div className="p-6 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA]">
                Preparing invoices for print...
              </p>
              <p className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                {loadedCount} of {totalCount} fetched
              </p>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-[#FAFAFA] dark:bg-[#151515] rounded-full h-1.5 overflow-hidden border border-[#ECECEC] dark:border-[#232323]">
              <div
                className="bg-indigo-600 h-full transition-all duration-200"
                style={{ width: `${totalCount > 0 ? (loadedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-[#71717A] dark:text-[#A1A1AA]">
            <p>
              This will prepare all <strong>{totalCount}</strong> invoices matching your current search and date filters for printing.
            </p>

            {/* Filter Summary */}
            <div className="p-3 rounded-lg bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] space-y-1 font-mono text-[11px]">
              {searchQuery && (
                <p>
                  <strong className="text-[#111111] dark:text-[#FAFAFA]">Query:</strong> "{searchQuery}"
                </p>
              )}
              {(startDate || endDate) && (
                <p>
                  <strong className="text-[#111111] dark:text-[#FAFAFA]">Date Range:</strong>{' '}
                  {startDate || 'Beginning'} to {endDate || 'Today'}
                </p>
              )}
              {!searchQuery && !startDate && !endDate && (
                <p className="text-[#71717A] italic">No active filters (All records selected)</p>
              )}
            </div>

            <p className="text-[11px] italic">
              Note: Every invoice will be formatted on a separate A4 document page.
            </p>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ECECEC] dark:border-[#232323]">
          {errorMessage ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 text-xs border-[#ECECEC] dark:border-[#232323]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={onConfirm}
                className="h-8 text-xs font-semibold px-4 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Retry
              </Button>
            </>
          ) : isPreparing ? (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="h-8 text-xs border-[#ECECEC] dark:border-[#232323] opacity-60"
            >
              Preparing...
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 text-xs border-[#ECECEC] dark:border-[#232323]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={onConfirm}
                className="h-8 text-xs font-semibold px-4 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print All ({totalCount})
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
