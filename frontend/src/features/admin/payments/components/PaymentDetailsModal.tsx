import React from 'react';
import type { OrderResponse } from '../../../orders/order.types';
import { PaymentStatusBadge, OrderStatusBadge } from '../../../orders/components/OrderStatusBadge';
import { Button } from '../../../../components/ui/button';
import { X, Eye, FileText, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaymentDetailsModalProps {
  order: OrderResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecordPayment: (order: OrderResponse) => void;
}

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onOpenRecordPayment,
}) => {
  const navigate = useNavigate();

  if (!isOpen || !order) return null;

  const totalAmount = order.totalAmount || 0;
  const alreadyPaid = order.amountReceived || 0;
  const currentOutstanding = Math.max(0, totalAmount - alreadyPaid);

  const formatCurrency = (val: number = 0) => {
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#ECECEC] dark:border-[#232323]">
          <div>
            <span className="text-[10px] uppercase font-mono text-[#71717A] dark:text-[#A1A1AA] tracking-wider">
              Payment & Receivable Detail
            </span>
            <h2 className="text-base font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
              {order.orderNumber}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 text-xs">
          {/* Customer & Status Info */}
          <div className="grid grid-cols-2 gap-4 p-3.5 rounded-xl bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323]">
            <div>
              <p className="text-[10px] uppercase font-semibold text-[#71717A] dark:text-[#A1A1AA] tracking-wider">
                Customer
              </p>
              <p className="font-bold text-[#111111] dark:text-[#FAFAFA] mt-0.5">{order.customerName}</p>
              {order.customerCode && (
                <p className="font-mono text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                  Code: {order.customerCode}
                </p>
              )}
            </div>

            <div className="space-y-1 text-right">
              <p className="text-[10px] uppercase font-semibold text-[#71717A] dark:text-[#A1A1AA] tracking-wider">
                Order & Payment Status
              </p>
              <div className="flex justify-end gap-1.5 flex-wrap pt-0.5">
                <OrderStatusBadge status={order.orderStatus} />
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA]">
              Financial Breakdown
            </h3>
            <div className="space-[#111111] space-y-1.5 p-3.5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F]">
              <div className="flex justify-between font-mono">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">Order Total:</span>
                <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              <div className="flex justify-between font-mono">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">Amount Settled / Paid:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(alreadyPaid)}
                </span>
              </div>

              <div className="pt-2 border-t border-[#ECECEC] dark:border-[#232323] flex justify-between font-mono text-sm">
                <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">
                  Current Outstanding:
                </span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {formatCurrency(currentOutstanding)}
                </span>
              </div>
            </div>
          </div>

          {/* Order Items Preview */}
          {order.items && order.items.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA]">
                Order Items ({order.items.length})
              </h3>
              <div className="max-h-36 overflow-y-auto border border-[#ECECEC] dark:border-[#232323] rounded-lg">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#FAFAFA] dark:bg-[#151515] border-b border-[#ECECEC] dark:border-[#232323] text-[#71717A] dark:text-[#A1A1AA]">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
                    {order.items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-2 px-3 text-[#111111] dark:text-[#FAFAFA]">
                          {item.productName}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-[#71717A] dark:text-[#A1A1AA]">
                          {item.quantity}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-[#111111] dark:text-[#FAFAFA]">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#FAFAFA] dark:bg-[#151515] border-t border-[#ECECEC] dark:border-[#232323] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/orders');
              }}
              className="text-xs h-8 border-[#ECECEC] dark:border-[#232323] gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              View Orders
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/admin/invoices');
              }}
              className="text-xs h-8 border-[#ECECEC] dark:border-[#232323] gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              Invoices
            </Button>
          </div>

          {currentOutstanding > 0 && order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'COMPLETED' && (
            <Button
              size="sm"
              onClick={() => {
                onClose();
                onOpenRecordPayment(order);
              }}
              className="text-xs h-8 font-semibold bg-[#111111] text-white dark:bg-[#FAFAFA] dark:text-[#111111] gap-1"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Record Payment
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
