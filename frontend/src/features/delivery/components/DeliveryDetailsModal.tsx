import React, { useState } from 'react';
import type { DeliveryOrderResponse, PaymentMethod } from '../delivery.types';
import { DeliveryStatusBadge } from './DeliveryStatusBadge';
import { PaymentStatusBadge } from '../../orders/components/OrderStatusBadge';
import { Button } from '../../../components/ui/button';
import {
  X,
  Phone,
  Navigation,
  MapPin,
  Package,
  CheckCircle2,
  Play,
  Loader2,
  FileText,
  User,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface DeliveryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: DeliveryOrderResponse | null;
  onStartDelivery: (orderId: number) => void;
  onMarkDelivered: (orderId: number, amountReceived: number, paymentMethod: PaymentMethod) => void;
  isStarting?: boolean;
  isMarkingDelivered?: boolean;
}

export const DeliveryDetailsModal: React.FC<DeliveryDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  onStartDelivery,
  onMarkDelivered,
  isStarting = false,
  isMarkingDelivered = false,
}) => {
  const [showMarkDeliveredConfirm, setShowMarkDeliveredConfirm] = useState(false);
  const [amountReceivedInput, setAmountReceivedInput] = useState<string>('');
  const [paymentMethodInput, setPaymentMethodInput] = useState<PaymentMethod>('CASH');

  if (!isOpen || !order) return null;

  const handleOpenMarkDelivered = () => {
    setAmountReceivedInput(order.totalAmount ? order.totalAmount.toString() : '0');
    setPaymentMethodInput((order.paymentMethod as PaymentMethod) || 'CASH');
    setShowMarkDeliveredConfirm(true);
  };

  const handleConfirmMarkDelivered = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountReceivedInput);
    if (isNaN(amount) || amount < 0) return;

    onMarkDelivered(order.id, amount, paymentMethodInput);
    setShowMarkDeliveredConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ECECEC] dark:border-[#232323]">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
                {order.orderNumber}
              </h2>
              <DeliveryStatusBadge status={order.orderStatus} />
            </div>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              Assigned on {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#151515] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Information Card */}
        <div className="p-3.5 rounded-xl bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1">
              <User className="w-3 h-3" /> Customer
            </span>
            {order.customerPhone && (
              <a
                href={`tel:${order.customerPhone}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Phone className="w-3 h-3" />
                Call Customer
              </a>
            )}
          </div>
          <p className="text-sm font-bold text-[#111111] dark:text-[#FAFAFA]">
            {order.customerName}
          </p>
          {order.customerPhone && (
            <p className="font-mono text-[#71717A] dark:text-[#A1A1AA]">
              {order.customerPhone}
            </p>
          )}
        </div>

        {/* Delivery Address Card */}
        <div className="p-3.5 rounded-xl bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Delivery Address
            </span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                order.deliveryAddress || `${order.customerName}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <Navigation className="w-3 h-3" />
              View on Map
            </a>
          </div>
          <p className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA] leading-relaxed">
            {order.deliveryAddress || 'Address on file'}
          </p>
        </div>

        {/* Items Summary Table */}
        <div className="space-y-2">
          <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1">
            <Package className="w-3 h-3" /> Order Items ({order.items?.length || 0})
          </span>
          <div className="border border-[#ECECEC] dark:border-[#232323] rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAFAFA] dark:bg-[#151515] border-b border-[#ECECEC] dark:border-[#232323] text-[#71717A] dark:text-[#A1A1AA] font-medium text-[10px] uppercase">
                  <th className="py-2 px-3">Product</th>
                  <th className="py-2 px-3 text-right">Qty</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
                {order.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 px-3 font-medium text-[#111111] dark:text-[#FAFAFA]">
                      {item.productName}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-[#71717A] dark:text-[#A1A1AA]">
                      {item.quantity} {item.unit || ''}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-[#111111] dark:text-[#FAFAFA]">
                      ₹{item.lineTotal?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary & Payment */}
        <div className="p-3.5 rounded-xl bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Payment Details
            </span>
            <div className="flex items-center gap-2 mt-1">
              <PaymentStatusBadge status={order.paymentStatus} />
              {order.paymentMethod && (
                <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                  ({order.paymentMethod})
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block">Total Amount</span>
            <span className="text-base font-extrabold font-mono text-[#111111] dark:text-[#FAFAFA]">
              ₹{order.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Instructions / Notes */}
        {(order.deliveryInstructions || order.notes) && (
          <div className="space-y-1 text-xs p-3 rounded-lg bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323]">
            <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1 mb-1">
              <FileText className="w-3 h-3" /> Instructions & Notes
            </span>
            {order.deliveryInstructions && (
              <p className="text-[#71717A] dark:text-[#A1A1AA]">
                <strong className="text-[#111111] dark:text-[#FAFAFA]">Delivery:</strong> {order.deliveryInstructions}
              </p>
            )}
            {order.notes && (
              <p className="text-[#71717A] dark:text-[#A1A1AA]">
                <strong className="text-[#111111] dark:text-[#FAFAFA]">Notes:</strong> {order.notes}
              </p>
            )}
          </div>
        )}

        {/* Action Section / Mark Delivered Confirmation */}
        {showMarkDeliveredConfirm ? (
          <form
            onSubmit={handleConfirmMarkDelivered}
            className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-3 text-xs"
          >
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Mark Order {order.orderNumber} as Delivered?</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 block mb-1">
                  Amount Received (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={amountReceivedInput}
                  onChange={(e) => setAmountReceivedInput(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-[#111111] text-[#111111] dark:text-[#FAFAFA] font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 block mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethodInput}
                  onChange={(e) => setPaymentMethodInput(e.target.value as PaymentMethod)}
                  className="w-full text-xs p-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-[#111111] text-[#111111] dark:text-[#FAFAFA]"
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">CARD</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="submit"
                size="sm"
                disabled={isMarkingDelivered}
                className="h-8 text-xs font-semibold px-4 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                {isMarkingDelivered ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Confirm Delivery
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMarkDeliveredConfirm(false)}
                className="h-8 text-xs font-medium px-3 border-[#ECECEC] dark:border-[#232323]"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between pt-3 border-t border-[#ECECEC] dark:border-[#232323]">
            <div>
              {order.orderStatus === 'ASSIGNED' && (
                <Button
                  size="sm"
                  disabled={isStarting}
                  onClick={() => onStartDelivery(order.id)}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 h-8 gap-1.5 rounded-lg"
                >
                  {isStarting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-white" />
                  )}
                  Start Delivery
                </Button>
              )}

              {order.orderStatus === 'OUT_FOR_DELIVERY' && (
                <Button
                  size="sm"
                  onClick={handleOpenMarkDelivered}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 h-8 gap-1.5 rounded-lg"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark as Delivered
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs border-[#ECECEC] dark:border-[#232323] h-8"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
