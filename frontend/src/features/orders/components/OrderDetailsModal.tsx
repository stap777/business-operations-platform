import React, { useState } from 'react';
import type { OrderResponse } from '../order.types';
import { OrderStatusBadge, PaymentStatusBadge, DeliveryStatusBadge } from './OrderStatusBadge';
import { Button } from '../../../components/ui/button';
import { X, User, Truck, FileText, AlertTriangle, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderResponse | null;
  onCancelOrder?: (id: number) => void;
  onVerifyOrder?: (id: number) => void;
  isCancelling?: boolean;
  isVerifying?: boolean;
  userRole?: string;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  onCancelOrder,
  onVerifyOrder,
  isCancelling = false,
  isVerifying = false,
  userRole,
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);

  if (!isOpen || !order) return null;

  const handleConfirmCancel = () => {
    if (onCancelOrder) {
      onCancelOrder(order.id);
      setShowCancelConfirm(false);
    }
  };

  const handleConfirmVerify = () => {
    if (onVerifyOrder) {
      onVerifyOrder(order.id);
      setShowVerifyConfirm(false);
    }
  };

  const isCancellable =
    order.orderStatus !== 'CANCELLED' &&
    order.orderStatus !== 'COMPLETED' &&
    order.orderStatus !== 'DELIVERED' &&
    order.orderStatus !== 'VERIFIED';

  const isVerifiable = userRole === 'ADMIN' && order.orderStatus === 'DELIVERED';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ECECEC] dark:border-[#232323]">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
                {order.orderNumber}
              </h2>
              <OrderStatusBadge status={order.orderStatus} />
            </div>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              Created on {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#151515] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer & Personnel Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs p-3.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515]">
          <div className="space-y-1.5">
            <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1">
              <User className="w-3 h-3" /> Customer Details
            </span>
            <p className="font-semibold text-[#111111] dark:text-[#FAFAFA]">
              {order.customerName}
            </p>
            {order.customerCode && (
              <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                Code: {order.customerCode}
              </p>
            )}
            {order.managerName && (
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                Manager: <span className="text-[#111111] dark:text-[#FAFAFA] font-medium">{order.managerName}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1">
              <Truck className="w-3 h-3" /> Fulfillment & Delivery
            </span>
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <div>
                <span className="text-[10px] text-[#71717A] block">Payment</span>
                <PaymentStatusBadge status={order.paymentStatus} />
                {order.paymentMethod && (
                  <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block mt-0.5 font-mono">
                    {order.paymentMethod}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[10px] text-[#71717A] block">Delivery</span>
                <DeliveryStatusBadge status={order.deliveryStatus} />
                {order.deliveryPersonName && (
                  <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block mt-0.5">
                    {order.deliveryPersonName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA]">Order Items</h3>
          <div className="border border-[#ECECEC] dark:border-[#232323] rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAFAFA] dark:bg-[#151515] border-b border-[#ECECEC] dark:border-[#232323] text-[#71717A] dark:text-[#A1A1AA] font-medium text-[10px] uppercase">
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
                {order.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 px-3 font-medium text-[#111111] dark:text-[#FAFAFA]">
                      {item.productName}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#71717A] dark:text-[#A1A1AA]">
                      ₹{item.sellingPrice?.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#111111] dark:text-[#FAFAFA]">
                      {item.quantity} {item.unit || 'units'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#111111] dark:text-[#FAFAFA]">
                      ₹{item.lineTotal?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Totals */}
        <div className="flex flex-col items-end space-y-1.5 text-xs text-[#71717A] dark:text-[#A1A1AA] pt-2 border-t border-[#ECECEC] dark:border-[#232323]">
          <div className="flex justify-between w-52">
            <span>Subtotal:</span>
            <span className="font-mono text-[#111111] dark:text-[#FAFAFA]">₹{order.subtotal?.toFixed(2)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between w-52 text-emerald-600 dark:text-emerald-400">
              <span>Discount:</span>
              <span className="font-mono">-₹{order.discountAmount?.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between w-52 font-bold text-sm text-[#111111] dark:text-[#FAFAFA] pt-1.5 border-t border-[#ECECEC] dark:border-[#232323]">
            <span>Total Amount:</span>
            <span className="font-mono">₹{order.totalAmount?.toFixed(2)}</span>
          </div>
        </div>

        {/* Instructions & Notes */}
        {(order.deliveryInstructions || order.notes) && (
          <div className="space-y-1.5 text-xs p-3 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515]">
            <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1 mb-1">
              <FileText className="w-3 h-3" /> Additional Notes
            </span>
            {order.deliveryInstructions && (
              <p className="text-[#71717A] dark:text-[#A1A1AA]">
                <strong className="text-[#111111] dark:text-[#FAFAFA]">Delivery Instructions:</strong> {order.deliveryInstructions}
              </p>
            )}
            {order.notes && (
              <p className="text-[#71717A] dark:text-[#A1A1AA]">
                <strong className="text-[#111111] dark:text-[#FAFAFA]">Internal Notes:</strong> {order.notes}
              </p>
            )}
          </div>
        )}

        {/* Admin Verification Confirmation Sub-view */}
        {showVerifyConfirm ? (
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 text-xs space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <span>Verify order {order.orderNumber}?</span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-white/70 dark:bg-[#111111]/70 border border-indigo-100 dark:border-indigo-900/40 text-[11px]">
              <div>
                <span className="text-[#71717A] block">Delivered by:</span>
                <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">
                  {order.deliveryPersonName || 'Assigned Agent'}
                </span>
              </div>
              <div>
                <span className="text-[#71717A] block">Order Amount:</span>
                <span className="font-semibold font-mono text-[#111111] dark:text-[#FAFAFA]">
                  ₹{order.totalAmount?.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[#71717A] block">Payment Status:</span>
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
              <div>
                <span className="text-[#71717A] block">Stock Action:</span>
                <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">Deduct Inventory</span>
              </div>
            </div>

            <p className="text-[#71717A] dark:text-[#A1A1AA] text-[11px]">
              Confirming verification will transition status to <strong>VERIFIED</strong>, generate an official invoice, deduct inventory stock, and log an audit entry.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                disabled={isVerifying}
                onClick={handleConfirmVerify}
                className="h-8 text-xs font-semibold px-4 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              >
                {isVerifying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Confirm Verification
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVerifyConfirm(false)}
                className="h-8 text-xs font-medium px-3 border-[#ECECEC] dark:border-[#232323]"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : showCancelConfirm ? (
          <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-xs space-y-2">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Are you sure you want to cancel order {order.orderNumber}?</span>
            </div>
            <p className="text-red-600 dark:text-red-400 text-[11px]">
              This action cannot be undone once confirmed.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="destructive"
                size="sm"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="h-7 text-xs font-medium px-3 bg-red-600 hover:bg-red-700 text-white"
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelConfirm(false)}
                className="h-7 text-xs font-medium px-3 border-[#ECECEC] dark:border-[#232323]"
              >
                Keep Order
              </Button>
            </div>
          </div>
        ) : (
          /* Footer Actions */
          <div className="flex items-center justify-between pt-3 border-t border-[#ECECEC] dark:border-[#232323]">
            <div className="flex items-center gap-2">
              {isVerifiable && onVerifyOrder && (
                <Button
                  size="sm"
                  disabled={isVerifying}
                  onClick={() => setShowVerifyConfirm(true)}
                  className="text-xs font-semibold px-4 h-8 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-2xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verify Order
                </Button>
              )}

              {onCancelOrder && isCancellable && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isCancelling}
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  Cancel Order
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs border-[#ECECEC] dark:border-[#232323]"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
