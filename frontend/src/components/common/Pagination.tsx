import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number; // 0-indexed
  totalPages: number;
  totalElements?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalElements,
  pageSize = 20,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const startElement = currentPage * pageSize + 1;
  const endElement = totalElements
    ? Math.min((currentPage + 1) * pageSize, totalElements)
    : (currentPage + 1) * pageSize;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 border-t border-slate-200 dark:border-slate-800 ${className}`}>
      {totalElements !== undefined && (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Showing <span className="font-medium text-slate-700 dark:text-slate-200">{startElement}</span> to{' '}
          <span className="font-medium text-slate-700 dark:text-slate-200">{endElement}</span> of{' '}
          <span className="font-medium text-slate-700 dark:text-slate-200">{totalElements}</span> results
        </div>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">
          Page {currentPage + 1} of {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
