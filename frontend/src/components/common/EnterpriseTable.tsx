import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Search,
} from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface EnterpriseTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  keyExtractor: (row: T) => string | number;
  // Selection
  enableSelection?: boolean;
  selectedIds?: (string | number)[];
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
  // Pagination
  currentPage?: number;
  totalPages?: number;
  totalElements?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  // Search & Filter
  searchPlaceholder?: string;
  onSearchChange?: (term: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function EnterpriseTable<T>({
  columns,
  data,
  isLoading = false,
  error = null,
  onRetry,
  keyExtractor,
  enableSelection = false,
  selectedIds = [],
  onSelectionChange,
  currentPage = 0,
  totalPages = 1,
  totalElements,
  pageSize = 10,
  onPageChange,
  searchPlaceholder = 'Filter records...',
  onSearchChange,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records matching your current filter criteria.',
}: EnterpriseTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() =>
    columns.reduce((acc, col) => ({ ...acc, [col.id]: true }), {})
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Handle local sorting if not server-side
  const handleSort = (colId: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortColumn === colId) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(colId);
      setSortDirection('asc');
    }
  };

  const activeColumns = useMemo(
    () => columns.filter((col) => visibleColumns[col.id] !== false),
    [columns, visibleColumns]
  );

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    if (selectedIds.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map(keyExtractor));
    }
  };

  const toggleSelectRow = (id: string | number) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((item) => item !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;
    const col = columns.find((c) => c.id === sortColumn);
    if (!col || !col.accessorKey) return data;

    return [...data].sort((a, b) => {
      const valA = a[col.accessorKey!];
      const valB = b[col.accessorKey!];
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection, columns]);

  return (
    <div className="space-y-4 w-full">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (onSearchChange) onSearchChange(e.target.value);
            }}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Column Visibility Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((col) => (
                <DropdownMenuItem
                  key={col.id}
                  onClick={() =>
                    setVisibleColumns((prev) => ({
                      ...prev,
                      [col.id]: !prev[col.id],
                    }))
                  }
                  className="justify-between"
                >
                  <span>{col.header}</span>
                  {visibleColumns[col.id] !== false && <CheckSquare className="h-3.5 w-3.5 text-blue-600" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs">
        {error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : (
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            {/* Sticky Header */}
            <thead className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-800/80 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                {enableSelection && (
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      {selectedIds.length === data.length && data.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                )}
                {activeColumns.map((col) => (
                  <th
                    key={col.id}
                    onClick={() => handleSort(col.id, col.sortable)}
                    className={`px-6 py-3.5 select-none ${
                      col.sortable ? 'cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-700/50' : ''
                    } ${col.className || ''}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {sortColumn === col.id ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="h-3.5 w-3.5 text-blue-600" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-blue-600" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
              {isLoading ? (
                Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, idx) => (
                  <tr key={idx}>
                    {enableSelection && (
                      <td className="px-4 py-3.5">
                        <Skeleton className="h-4 w-4" />
                      </td>
                    )}
                    {activeColumns.map((col) => (
                      <td key={col.id} className="px-6 py-3.5">
                        <Skeleton className="h-4 w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={activeColumns.length + (enableSelection ? 1 : 0)} className="p-0">
                    <EmptyState title={emptyTitle} description={emptyDescription} />
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {sortedData.map((row) => {
                    const rowKey = keyExtractor(row);
                    const isSelected = selectedIds.includes(rowKey);

                    return (
                      <motion.tr
                        key={rowKey}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                          isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        {enableSelection && (
                          <td className="px-4 py-3.5">
                            <button onClick={() => toggleSelectRow(rowKey)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                        )}
                        {activeColumns.map((col) => (
                          <td key={col.id} className={`px-6 py-3.5 whitespace-nowrap ${col.className || ''}`}>
                            {col.cell
                              ? col.cell(row)
                              : col.accessorKey
                              ? String(row[col.accessorKey] ?? '')
                              : null}
                          </td>
                        ))}
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {onPageChange && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
