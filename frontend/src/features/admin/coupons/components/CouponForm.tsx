import React, { useState, useEffect } from 'react';
import type { CouponRequest, CouponResponse, DiscountType } from '../coupon.types';
import { Button } from '../../../../components/ui/button';
import { Loader2 } from 'lucide-react';
import { Modal } from '../../../../components/common/Modal';

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

    const payload: CouponRequest = {
      code: trimmedCode,
      description: description.trim() || undefined,
      discountType,
      discountValue: valNum,
      minimumOrderAmount: minimumOrderAmount ? parseFloat(minimumOrderAmount) : 0,
      maximumDiscount: maximumDiscount ? parseFloat(maximumDiscount) : undefined,
      startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : new Date().toISOString(),
      usageLimit: usageLimit ? parseInt(usageLimit, 10) : 0,
      active,
    };

    onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Coupon' : 'Create New Coupon'}
      subtitle={
        initialData
          ? 'Update promotional discount parameters.'
          : 'Configure a new promotional code for orders.'
      }
      maxWidth="xl"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs rounded-xl border-[#E4E4E7] dark:border-[#27272A]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            size="sm"
            disabled={isSubmitting}
            className="bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B] hover:bg-[#27272A] dark:hover:bg-[#E4E4E7] text-xs font-semibold gap-1.5 rounded-xl shadow-xs"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {initialData ? 'Save Changes' : 'Create Coupon'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {validationError && (
          <div className="p-3 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 rounded-xl text-xs font-medium border border-red-200 dark:border-red-800/40">
            {validationError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
              Coupon Code *
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SUMMER50"
              className="w-full px-3.5 py-2.5 font-mono font-bold bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
              Discount Type *
            </label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as DiscountType)}
              className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 cursor-pointer"
            >
              <option value="FLAT">FLAT (Fixed Amount ₹)</option>
              <option value="PERCENTAGE">PERCENTAGE (%)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
              Discount Value *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === 'FLAT' ? '100' : '10'}
              className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
              Minimum Order Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={minimumOrderAmount}
              onChange={(e) => setMinimumOrderAmount(e.target.value)}
              placeholder="500"
              className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
            />
          </div>
        </div>

        {discountType === 'PERCENTAGE' && (
          <div>
            <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
              Maximum Discount Cap (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={maximumDiscount}
              onChange={(e) => setMaximumDiscount(e.target.value)}
              placeholder="e.g. 200"
              className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
              Valid From
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
              Valid Until
            </label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
            Usage Cap Limit
          </label>
          <input
            type="number"
            min="1"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            placeholder="100"
            className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Festive discount for summer orders..."
            className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
};
