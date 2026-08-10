import React, { useState } from 'react';
import type { OrderResponse } from '../../../orders/order.types';
import type { PaymentMethod } from '../payment.types';
import { useRecordPayment } from '../hooks/usePayments';
import { Button } from '../../../../components/ui/button';
import { X, CreditCard, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RecordPaymentModalProps {
  order: OrderResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !order) return null;

  const totalAmount = order.totalAmount || 0;
  const alreadyPaid = order.amountReceived || 0;
  const currentOutstanding = Math.max(0, totalAmount - alreadyPaid);

  const [paymentAmount, setPaymentAmount] = useState<string>(currentOutstanding.toString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [remarks, setRemarks] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recordPaymentMutation = useRecordPayment();

  const parsedAmount = parseFloat(paymentAmount) || 0;
  const outstandingAfterPayment = Math.max(0, currentOutstanding - parsedAmount);

  const formatCurrency = (val: number = 0) => {
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic UX Client Validation
    if (parsedAmount <= 0) {
      setErrorMessage('Payment amount must be greater than 0');
      return;
    }

    if (parsedAmount > currentOutstanding) {
      setErrorMessage(`Payment amount cannot exceed outstanding balance of ${formatCurrency(currentOutstanding)}`);
      return;
    }

    recordPaymentMutation.mutate(
      {
        customerId: order.customerId,
        totalAmount: parsedAmount,
        paymentMethod,
        remarks: remarks.trim() || undefined,
        allocations: [
          {
            orderId: order.id,
            allocatedAmount: parsedAmount,
          },
        ],
      },
      {
        onSuccess: (res) => {
          toast.success(`Payment recorded successfully (${res.paymentNumber})`);
          onSuccess();
          onClose();
        },
        onError: (err: any) => {
          const message =
            err.response?.data?.message ||
            err.response?.data?.error ||
            'Failed to record payment. Please verify order state and try again.';
          setErrorMessage(message);
          toast.error(message);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#ECECEC] dark:border-[#232323]">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-[#111111] dark:text-[#FAFAFA]">
              Record Payment
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Summary Header */}
        <div className="bg-[#FAFAFA] dark:bg-[#151515] p-3.5 border-b border-[#ECECEC] dark:border-[#232323] space-y-1 text-xs">
          <div className="flex justify-between font-mono">
            <span className="text-[#71717A] dark:text-[#A1A1AA]">Order:</span>
            <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#71717A] dark:text-[#A1A1AA]">Customer:</span>
            <span className="font-medium text-[#111111] dark:text-[#FAFAFA]">{order.customerName}</span>
          </div>
          <div className="flex justify-between font-mono pt-1">
            <span className="text-[#71717A] dark:text-[#A1A1AA]">Outstanding Balance:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(currentOutstanding)}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="m-3.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          {/* Payment Amount Input */}
          <div className="space-y-1">
            <label className="block font-medium text-[#111111] dark:text-[#FAFAFA]">
              Payment Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={currentOutstanding}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-sm font-mono font-bold text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
            />
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1">
            <label className="block font-medium text-[#111111] dark:text-[#FAFAFA]">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-xs text-[#111111] dark:text-[#FAFAFA] focus:outline-none cursor-pointer"
            >
              <option value="CASH">CASH</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">BANK TRANSFER</option>
            </select>
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <label className="block font-medium text-[#71717A] dark:text-[#A1A1AA]">
              Remarks / Transaction Reference (Optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              placeholder="e.g. UPI ref #9812401 or cash collection notes"
              className="w-full px-3 py-2 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-xs text-[#111111] dark:text-[#FAFAFA] placeholder:text-[#71717A] dark:placeholder:text-[#A1A1AA] focus:outline-none"
            />
          </div>

          {/* Calculated Preview */}
          <div className="p-3 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] flex items-center justify-between font-mono text-xs">
            <span className="text-[#71717A] dark:text-[#A1A1AA]">Outstanding After Payment:</span>
            <span
              className={`font-bold ${
                outstandingAfterPayment === 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {formatCurrency(outstandingAfterPayment)}
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
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
              disabled={recordPaymentMutation.isPending || parsedAmount <= 0}
              className="text-xs font-semibold bg-[#111111] text-white dark:bg-[#FAFAFA] dark:text-[#111111]"
            >
              {recordPaymentMutation.isPending ? 'Processing Payment...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
