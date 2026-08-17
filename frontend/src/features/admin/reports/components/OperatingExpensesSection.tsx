import React, { useState } from 'react';
import type { OperatingExpenseResponse } from '../report.types';
import { useOperatingExpenses, useDeleteOperatingExpense } from '../hooks/useReports';
import { ExpenseModal } from './ExpenseModal';
import { Button } from '../../../../components/ui/button';
import { Plus, Edit2, Trash2, Receipt, AlertCircle, Loader2 } from 'lucide-react';

interface OperatingExpensesSectionProps {
  startDate?: string;
  endDate?: string;
}

export const OperatingExpensesSection: React.FC<OperatingExpensesSectionProps> = ({
  startDate,
  endDate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<OperatingExpenseResponse | null>(null);
  const [expenseToDeleteId, setExpenseToDeleteId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useOperatingExpenses({
    startDate,
    endDate,
  });

  const deleteMutation = useDeleteOperatingExpense();

  const handleOpenAdd = () => {
    setExpenseToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (expense: OperatingExpenseResponse) => {
    setExpenseToEdit(expense);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (expenseToDeleteId !== null) {
      deleteMutation.mutate(expenseToDeleteId, {
        onSuccess: () => {
          setExpenseToDeleteId(null);
        },
      });
    }
  };

  const expenses = data?.content || [];
  const totalExpenseSum = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const getCategoryBadgeClass = (category: string) => {
    const cat = category.toUpperCase();
    if (cat === 'TRANSPORT') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    if (cat === 'WAGES') return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    if (cat === 'STATIONERY') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (cat === 'MISCELLANEOUS') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    return 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20';
  };

  return (
    <div className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-[#ECECEC] dark:border-[#232323] p-4 sm:p-6 space-y-4 shadow-xs">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ECECEC] dark:border-[#232323]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#111111] dark:text-[#FAFAFA]">Operating Expenses (OPEX)</h2>
            <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
              Recorded business operational costs, transport, wages, and stationery.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold border border-amber-500/20">
            Total: ₹{totalExpenseSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <Button
            onClick={handleOpenAdd}
            size="sm"
            className="bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] hover:opacity-90 text-xs font-medium gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Record Expense
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center space-y-2 text-[#71717A]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-xs">Loading operating expenses...</span>
        </div>
      ) : isError ? (
        <div className="py-6 text-center text-xs text-red-500">
          Failed to load operating expenses. Please try again.
        </div>
      ) : expenses.length === 0 ? (
        <div className="py-8 text-center space-y-2 border border-dashed border-[#ECECEC] dark:border-[#232323] rounded-lg bg-[#FAFAFA]/50 dark:bg-[#151515]/50">
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">No operating expenses recorded for this period.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenAdd}
            className="text-xs border-[#ECECEC] dark:border-[#232323]"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add First Expense
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table View (hidden on small screens) */}
          <div className="hidden sm:block overflow-x-auto border border-[#ECECEC] dark:border-[#232323] rounded-lg">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAFAFA] dark:bg-[#151515] border-b border-[#ECECEC] dark:border-[#232323] text-[#71717A] dark:text-[#A1A1AA] font-semibold text-[10px] uppercase">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Recorded By</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#151515] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[#71717A] dark:text-[#A1A1AA] text-[11px]">
                      {expense.expenseDate}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getCategoryBadgeClass(expense.category)}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#111111] dark:text-[#FAFAFA]">
                      {expense.description}
                      {expense.notes && (
                        <span className="block text-[10px] text-[#71717A] dark:text-[#A1A1AA] italic">
                          {expense.notes}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[#71717A] dark:text-[#A1A1AA] text-[11px]">
                      {expense.createdByName || 'System'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#111111] dark:text-[#FAFAFA]">
                      ₹{expense.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(expense)}
                          className="p-1 rounded-md text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-[#1A1A1A] transition-colors"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setExpenseToDeleteId(expense.id)}
                          className="p-1 rounded-md text-[#71717A] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (shown on mobile viewports) */}
          <div className="sm:hidden space-y-2">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="p-3 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA]/50 dark:bg-[#151515]/50 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getCategoryBadgeClass(expense.category)}`}>
                    {expense.category}
                  </span>
                  <span className="font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
                    {expense.expenseDate}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{expense.description}</p>
                    {expense.notes && (
                      <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] italic">{expense.notes}</p>
                    )}
                  </div>
                  <p className="font-mono font-bold text-sm text-[#111111] dark:text-[#FAFAFA]">
                    ₹{expense.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#ECECEC] dark:border-[#232323] text-[10px] text-[#71717A]">
                  <span>By: {expense.createdByName || 'System'}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(expense)}
                      className="text-xs text-blue-600 dark:text-blue-400 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setExpenseToDeleteId(expense.id)}
                      className="text-xs text-red-600 dark:text-red-400 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Expense Modal (Add / Edit) */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          refetch();
        }}
        expenseToEdit={expenseToEdit}
      />

      {/* Delete Confirmation Dialog */}
      {expenseToDeleteId !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] w-full max-w-sm rounded-xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Delete Operating Expense?</span>
            </div>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              This action will permanently remove this expense record and update business profit metrics.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpenseToDeleteId(null)}
                className="text-xs border-[#ECECEC] dark:border-[#232323]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={deleteMutation.isPending}
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Expense'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
