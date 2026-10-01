import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/ui/button';
import type { OrderResponse, VoidOrderRequest } from '../order.types';
import { OrderStatusBadge, PaymentStatusBadge } from './OrderStatusBadge';
import { AlertOctagon, AlertTriangle, Loader2 } from 'lucide-react';

interface VoidOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderResponse | null;
  onConfirm: (orderId: number, data: VoidOrderRequest) => void;
  isVoiding?: boolean;
}

export const VOID_REASONS = [
  'Wrong customer',
  'Wrong product',
  'Wrong quantity',
  'Wrong price',
  'Duplicate order',
  'Other',
] as const;

export const VoidOrderModal: React.FC<VoidOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirm,
  isVoiding = false,
}) => {
  const [reason, setReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setCustomReason('');
      setNotes('');
      setValidationError(null);
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalReason = reason === 'Other' ? customReason.trim() : reason;
    if (!finalReason) {
      setValidationError('Please select or enter a reason for voiding this order.');
      return;
    }

    onConfirm(order.id, {
      reason: finalReason,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Void Order"
      subtitle={`Permanently invalidate active order ${order.orderNumber}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warning Banner */}
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40 space-y-2">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-semibold text-xs">
            <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>Void order {order.orderNumber}?</span>
          </div>
          <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
            This order will remain in the system for audit purposes but will no longer be treated as an active sale. Deducted inventory will be restored and sales revenue will be excluded.
          </p>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-900/30 p-2 rounded-lg border border-rose-200/60 dark:border-rose-800/40">
            <strong>Important Accounting Notice:</strong> Voiding an order does <em>not</em> automatically refund payments. Payment and refund states remain distinct for bank reconciliation.
          </div>
        </div>

        {/* Order Summary Snapshot */}
        <div className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-[#111111] dark:text-[#FAFAFA]">
              {order.orderNumber}
            </span>
            <div className="flex items-center gap-1.5">
              <OrderStatusBadge status={order.orderStatus} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#ECECEC]/70 dark:border-[#232323]/70">
            <div>
              <span className="text-[#71717A] dark:text-[#A1A1AA] block">Customer:</span>
              <span className="font-semibold text-[#111111] dark:text-[#FAFAFA] truncate block">
                {order.customerName}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[#71717A] dark:text-[#A1A1AA] block">Total Amount:</span>
              <span className="font-mono font-bold text-sm text-[#111111] dark:text-[#FAFAFA]">
                ₹{order.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Reason Select */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#111111] dark:text-[#FAFAFA]">
            Reason for Voiding <span className="text-rose-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setValidationError(null);
            }}
            disabled={isVoiding}
            className="w-full text-xs rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#151515] px-3 py-2.5 text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          >
            <option value="">Select a reason...</option>
            {VOID_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Reason Input if 'Other' selected */}
        {reason === 'Other' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#111111] dark:text-[#FAFAFA]">
              Specify Reason <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={customReason}
              onChange={(e) => {
                setCustomReason(e.target.value);
                setValidationError(null);
              }}
              disabled={isVoiding}
              placeholder="e.g., Customer cancelled at doorstep due to change of plans"
              className="w-full text-xs rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#151515] px-3 py-2 text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>
        )}

        {/* Optional Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#111111] dark:text-[#FAFAFA]">
            Optional Explanation / Audit Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isVoiding}
            rows={3}
            placeholder="Add any additional context, authorization details, or error explanation..."
            className="w-full text-xs rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#151515] px-3 py-2 text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
          />
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ECECEC] dark:border-[#232323]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isVoiding}
            className="text-xs rounded-xl border-[#ECECEC] dark:border-[#232323] min-h-[40px]"
          >
            Keep Active
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isVoiding || !reason || (reason === 'Other' && !customReason.trim())}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl min-h-[40px] px-4 shadow-xs gap-1.5"
          >
            {isVoiding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Voiding Order...
              </>
            ) : (
              <>
                <AlertOctagon className="w-4 h-4" />
                Confirm Void Order
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
