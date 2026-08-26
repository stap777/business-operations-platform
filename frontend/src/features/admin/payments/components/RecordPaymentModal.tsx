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
  const [chequeDate, setChequeDate] = useState<string>('');
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

    if (paymentMethod === 'CHEQUE' && !chequeDate) {
      setErrorMessage('Cheque date is required for cheque payments');
      return;
    }

    recordPaymentMutation.mutate(
      {
        customerId: order.customerId,
        totalAmount: parsedAmount,
        paymentMethod,
        chequeDate: paymentMethod === 'CHEQUE' ? chequeDate : undefined,
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

        {/* Order Summary Card */}
        <div className="bg-[#FAFAFA] dark:bg-[#151515] p-4 border-b border-[#ECECEC] dark:border-[#232323] space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[#71717A] dark:text-[#A1A1AA] block text-[10px] uppercase font-semibold">Order Number</span>
              <span className="font-mono font-bold text-[#111111] dark:text-[#FAFAFA] text-sm">{order.orderNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-[#71717A] dark:text-[#A1A1AA] block text-[10px] uppercase font-semibold">Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                {order.paymentStatus || 'PENDING'}
              </span>
            </div>
          </div>

          <div className="text-[#71717A] dark:text-[#A1A1AA]">
            Customer: <strong className="text-[#111111] dark:text-[#FAFAFA]">{order.customerName}</strong>
          </div>

          {/* Total / Paid / Remaining Grid */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#ECECEC] dark:border-[#232323] text-center font-mono">
            <div className="p-2 bg-white dark:bg-[#0F0F0F] rounded-lg border border-[#ECECEC] dark:border-[#232323]">
              <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block font-sans">Total</span>
              <span className="font-semibold text-[#111111] dark:text-[#FAFAFA] text-xs">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="p-2 bg-white dark:bg-[#0F0F0F] rounded-lg border border-[#ECECEC] dark:border-[#232323]">
              <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block font-sans">Paid</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">{formatCurrency(alreadyPaid)}</span>
            </div>
            <div className="p-2 bg-white dark:bg-[#0F0F0F] rounded-lg border border-amber-200 dark:border-amber-900/40">
              <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-sans font-medium">Remaining</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 text-xs">{formatCurrency(currentOutstanding)}</span>
            </div>
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
              className="w-full px-3 py-2.5 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl text-base font-mono font-bold text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
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
              className="w-full px-3 py-2.5 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl text-xs text-[#111111] dark:text-[#FAFAFA] focus:outline-none cursor-pointer"
            >
              <option value="CASH">CASH</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">BANK TRANSFER</option>
              <option value="CHEQUE">CHEQUE</option>
              <option value="CREDIT">CREDIT</option>
            </select>
          </div>

          {/* Cheque Date Field (Only if CHEQUE is selected) */}
          {paymentMethod === 'CHEQUE' && (
            <div className="space-y-1 p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 rounded-xl">
              <label className="block font-medium text-[#111111] dark:text-[#FAFAFA]">
                Cheque Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={chequeDate}
                onChange={(e) => setChequeDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-xs text-[#111111] dark:text-[#FAFAFA] focus:outline-none"
              />
            </div>
          )}

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
              className="w-full px-3 py-2 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl text-xs text-[#111111] dark:text-[#FAFAFA] placeholder:text-[#71717A] dark:placeholder:text-[#A1A1AA] focus:outline-none"
            />
          </div>

          {/* Calculated Preview */}
          <div className="p-3 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] flex items-center justify-between font-mono text-xs">
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
              className="text-xs rounded-xl border-[#ECECEC] dark:border-[#232323] min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={recordPaymentMutation.isPending || parsedAmount <= 0}
              className="text-xs font-bold bg-[#111111] hover:bg-[#27272A] text-white dark:bg-[#FAFAFA] dark:hover:bg-[#E4E4E7] dark:text-[#111111] rounded-xl min-h-[44px] px-6 shadow-md"
            >
              {recordPaymentMutation.isPending ? 'Recording Payment...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
