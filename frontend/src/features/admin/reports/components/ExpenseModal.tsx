import React, { useState, useEffect } from 'react';
import type { OperatingExpenseResponse, OperatingExpenseRequest } from '../report.types';
import { useCreateOperatingExpense, useUpdateOperatingExpense } from '../hooks/useReports';
import { Button } from '../../../../components/ui/button';
import { X, Receipt, Loader2 } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: OperatingExpenseResponse | null;
}

const DEFAULT_CATEGORIES = ['Transport', 'Wages', 'Stationery', 'Miscellaneous', 'Custom'];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  expenseToEdit,
}) => {
  const createMutation = useCreateOperatingExpense();
  const updateMutation = useUpdateOperatingExpense();

  const [category, setCategory] = useState<string>('Transport');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (expenseToEdit) {
      const isPresetCategory = DEFAULT_CATEGORIES.some(
        (c) => c.toUpperCase() === expenseToEdit.category.toUpperCase()
      );
      if (isPresetCategory) {
        setCategory(
          DEFAULT_CATEGORIES.find(
            (c) => c.toUpperCase() === expenseToEdit.category.toUpperCase()
          ) || 'Transport'
        );
        setCustomCategory('');
      } else {
        setCategory('Custom');
        setCustomCategory(expenseToEdit.category);
      }
      setDescription(expenseToEdit.description || '');
      setAmount(expenseToEdit.amount ? expenseToEdit.amount.toString() : '');
      setExpenseDate(expenseToEdit.expenseDate || new Date().toISOString().split('T')[0]);
      setNotes(expenseToEdit.notes || '');
    } else {
      setCategory('Transport');
      setCustomCategory('');
      setDescription('');
      setAmount('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
    setErrors({});
  }, [expenseToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const finalCategory = category === 'Custom' ? customCategory.trim() : category;

    if (!finalCategory) {
      newErrors.category = 'Category is required.';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required.';
    }
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Valid amount greater than ₹0 is required.';
    }
    if (!expenseDate) {
      newErrors.expenseDate = 'Expense date is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalCategory = category === 'Custom' ? customCategory.trim() : category;
    const payload: OperatingExpenseRequest = {
      category: finalCategory.toUpperCase(),
      description: description.trim(),
      amount: parseFloat(amount),
      expenseDate,
      notes: notes.trim() || undefined,
    };

    if (expenseToEdit) {
      updateMutation.mutate(
        { id: expenseToEdit.id, data: payload },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-[#ECECEC] dark:border-[#232323] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">
                {expenseToEdit ? 'Edit Operating Expense' : 'Record Operating Expense'}
              </h2>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                Add transport, wages, stationery, or business expenses.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-[#1A1A1A]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Category Dropdown */}
          <div>
            <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
              Expense Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] cursor-pointer text-xs"
            >
              {DEFAULT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-[10px] text-red-500 mt-1">{errors.category}</p>}
          </div>

          {/* Custom Category Input */}
          {category === 'Custom' && (
            <div>
              <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
                Custom Category Name *
              </label>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Electricity, Rent, Maintenance"
                className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] text-xs"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
              Description *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Delivery vehicle fuel, Office paper bundles"
              className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] text-xs"
            />
            {errors.description && (
              <p className="text-[10px] text-red-500 mt-1">{errors.description}</p>
            )}
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] font-mono text-xs"
              />
              {errors.amount && <p className="text-[10px] text-red-500 mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
                Expense Date *
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] text-xs"
              />
              {errors.expenseDate && (
                <p className="text-[10px] text-red-500 mt-1">{errors.expenseDate}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Vendor invoice details, receipt numbers..."
              className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] text-xs resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#ECECEC] dark:border-[#232323] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs border-[#ECECEC] dark:border-[#232323]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] hover:opacity-90 text-xs font-medium gap-1.5"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {expenseToEdit ? 'Save Changes' : 'Record Expense'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
