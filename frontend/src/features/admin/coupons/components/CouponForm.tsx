import React, { useState, useEffect } from 'react';
import type { CouponRequest, CouponResponse, DiscountType } from '../coupon.types';
import { Button } from '../../../../components/ui/button';
import { X, Loader2 } from 'lucide-react';

interface CouponFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CouponRequest) => void;
  isSubmitting: boolean;
  initialData?: CouponResponse | null;
}

export const CouponForm: React.FC<CouponFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  initialData,
}) => {
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('FLAT');
  const [discountValue, setDiscountValue] = useState<string>('100');
  const [minimumOrderAmount, setMinimumOrderAmount] = useState<string>('500');
  const [maximumDiscount, setMaximumDiscount] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [usageLimit, setUsageLimit] = useState<string>('100');
  const [active, setActive] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Helper to format ISO to datetime-local string
  const toDatetimeLocal = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const tzOffset = date.getTimezoneOffset() * 60000;
      const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
      return localISOTime;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setDescription(initialData.description || '');
      setDiscountType(initialData.discountType);
      setDiscountValue(initialData.discountValue?.toString() || '');
      setMinimumOrderAmount(initialData.minimumOrderAmount?.toString() || '0');
      setMaximumDiscount(initialData.maximumDiscount?.toString() || '');
      setStartDate(toDatetimeLocal(initialData.startDate));
      setEndDate(toDatetimeLocal(initialData.endDate));
      setUsageLimit(initialData.usageLimit?.toString() || '100');
      setActive(initialData.active);
    } else {
      setCode('');
      setDescription('');
      setDiscountType('FLAT');
      setDiscountValue('100');
      setMinimumOrderAmount('500');
      setMaximumDiscount('');
      
      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      setStartDate(toDatetimeLocal(now.toISOString()));
      setEndDate(toDatetimeLocal(nextMonth.toISOString()));
      setUsageLimit('100');
      setActive(true);
    }
    setValidationError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setValidationError('Coupon code is required.');
      return;
    }

    const valNum = parseFloat(discountValue);
    if (isNaN(valNum) || valNum <= 0) {
      setValidationError('Discount value must be greater than 0.');
      return;
    }

    if (discountType === 'PERCENTAGE' && valNum > 100) {
      setValidationError('Percentage discount cannot exceed 100%.');
      return;
    }

    const minOrderNum = parseFloat(minimumOrderAmount);
    if (isNaN(minOrderNum) || minOrderNum < 0) {
      setValidationError('Minimum order amount cannot be negative.');
      return;
    }

    const usageLimitNum = parseInt(usageLimit, 10);
    if (isNaN(usageLimitNum) || usageLimitNum < 1) {
      setValidationError('Usage limit must be at least 1.');
      return;
    }

    if (!startDate || !endDate) {
      setValidationError('Start date and end date are required.');
      return;
    }

    const startISO = new Date(startDate).toISOString();
    const endISO = new Date(endDate).toISOString();

    if (new Date(startDate) >= new Date(endDate)) {
      setValidationError('Start date must be before end date.');
      return;
    }

    const payload: CouponRequest = {
      code: trimmedCode,
      description: description.trim() || undefined,
      discountType,
      discountValue: valNum,
      minimumOrderAmount: minOrderNum,
      maximumDiscount: maximumDiscount ? parseFloat(maximumDiscount) : undefined,
      startDate: startISO,
      endDate: endISO,
      usageLimit: usageLimitNum,
      active,
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#ECECEC] dark:border-[#232323]">
          <h2 className="text-base font-bold text-[#111111] dark:text-[#FAFAFA]">
            {initialData ? 'Edit Coupon' : 'Create New Coupon'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {validationError && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-xs text-red-600 dark:text-red-400 font-medium">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Code & Discount Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-[#111111] dark:text-[#FAFAFA] block mb-1">
                Coupon Code *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SAVE200"
                maxLength={30}
                required
                className="w-full p-2.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#1A1A1A] text-[#111111] dark:text-[#FAFAFA] font-mono font-bold uppercase"
              />
            </div>

            <div>
              <label className="font-semibold text-[#111111] dark:text-[#FAFAFA] block mb-1">
                Discount Type *
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                className="w-full p-2.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#1A1A1A] text-[#111111] dark:text-[#FAFAFA] font-medium"
              >
                <option value="FLAT">FLAT (Fixed Amount ₹)</option>
                <option value="PERCENTAGE">PERCENTAGE (%)</option>
              </select>
            </div>
          </div>

          {/* Discount Value & Max Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-[#111111] dark:text-[#FAFAFA] block mb-1">
                Discount Value * {discountType === 'FLAT' ? '(₹)' : '(%)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={discountType === 'PERCENTAGE' ? 100 : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'FLAT' ? '100' : '20'}
                required
                className="w-full p-2.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#1A1A1A] text-[#111111] dark:text-[#FAFAFA]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#111111] dark:text-[#FAFAFA] block mb-1">
                Max Discount (₹) {discountType === 'PERCENTAGE' ? '(Optional Cap)' : '(N/A for FLAT)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={maximumDiscount}
                onChange={(e) => setMaximumDiscount(e.target.value)}
                placeholder="e.g. 500"
                disabled={discountType === 'FLAT'}
                className="w-full p-2.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#1A1A1A] text-[#111111] dark:text-[#FAFAFA] disabled:opacity-50"
              />
            </div>
          </div>

          {/* Minimum Order & Usage Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-[#111111] dark:text-[#FAFAFA] block mb-1">
                Min Order Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={minimumOrderAmount}
                onChange={(e) => setMinimumOrderAmount(e.target.value)}
                placeholder="500"
                required
                className="w-full p-2.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#1A1A1A] text-[#111111] dark:text-[#FAFAFA]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#111111] dark:text-[#FAFAFA] block mb-1">
                Usage Limit (Count Cap) *
              </label>
              <input
                type="number"
                min="1"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="100"
                required
                className="w-full p-2.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#1A1A1A] text-[#111111] dark:text-[#FAFAFA]"
              />
            </div>
          </div>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-[#111111] dark:text-[#FAFAFA] block mb-1">
                Start Date *
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full p-2.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#1A1A1A] text-[#111111] dark:text-[#FAFAFA]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#111111] dark:text-[#FAFAFA] block mb-1">
                End Date *
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full p-2.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#1A1A1A] text-[#111111] dark:text-[#FAFAFA]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="font-semibold text-[#111111] dark:text-[#FAFAFA] block mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Festival promotional discount for order amounts above ₹500"
              maxLength={500}
              className="w-full p-2.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#1A1A1A] text-[#111111] dark:text-[#FAFAFA]"
            />
          </div>

          {/* Active Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="activeCheckbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded border-[#ECECEC] text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="activeCheckbox" className="font-semibold text-[#111111] dark:text-[#FAFAFA] cursor-pointer">
              Set coupon active immediately upon creation
            </label>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECECEC] dark:border-[#232323]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : initialData ? (
                'Update Coupon'
              ) : (
                'Create Coupon'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
