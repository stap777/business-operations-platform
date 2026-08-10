import React from 'react';
import type { OrderResponse } from '../../../orders/order.types';
import { PaymentStatusBadge } from '../../../orders/components/OrderStatusBadge';
import { Button } from '../../../../components/ui/button';
import { Eye, CreditCard } from 'lucide-react';

interface PaymentTableProps {
  orders: OrderResponse[];
  isLoading: boolean;
  onViewDetails: (order: OrderResponse) => void;
  onRecordPayment: (order: OrderResponse) => void;
}

export const PaymentTable: React.FC<PaymentTableProps> = ({
  orders,
  isLoading,
  onViewDetails,
  onRecordPayment,
}) => {
  const formatCurrency = (amount: number = 0) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <div className="border border-[#ECECEC] dark:border-[#232323] rounded-xl bg-white dark:bg-[#0F0F0F] overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-neutral-100 dark:bg-[#151515] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-12 text-center border border-[#ECECEC] dark:border-[#232323] rounded-xl bg-white dark:bg-[#0F0F0F] space-y-2">
        <p className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">No outstanding payments found</p>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
          All customer orders are currently settled or match selected filters.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[#ECECEC] dark:border-[#232323] rounded-xl bg-white dark:bg-[#0F0F0F] overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#FAFAFA] dark:bg-[#151515] border-b border-[#ECECEC] dark:border-[#232323] text-[#71717A] dark:text-[#A1A1AA] font-medium text-[10px] uppercase tracking-wider">
              <th className="py-3 px-4">Order #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4 text-right">Total Amount</th>
              <th className="py-3 px-4 text-right">Amount Paid</th>
              <th className="py-3 px-4 text-right">Outstanding</th>
              <th className="py-3 px-4">Payment Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
            {orders.map((order) => {
              const total = order.totalAmount || 0;
              const paid = order.amountReceived || 0;
              const outstanding = Math.max(0, total - paid);

              return (
                <tr key={order.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#151515] transition-colors">
                  {/* Order Number */}
                  <td className="py-3 px-4 font-mono font-semibold text-[#111111] dark:text-[#FAFAFA]">
                    {order.orderNumber}
                  </td>

                  {/* Customer Name */}
                  <td className="py-3 px-4 font-medium text-[#111111] dark:text-[#FAFAFA]">
                    {order.customerName}
                  </td>

                  {/* Total Amount */}
                  <td className="py-3 px-4 text-right font-mono text-[#111111] dark:text-[#FAFAFA]">
                    {formatCurrency(total)}
                  </td>

                  {/* Amount Paid */}
                  <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(paid)}
                  </td>

                  {/* Outstanding Amount */}
                  <td className="py-3 px-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                    {formatCurrency(outstanding)}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(order)}
                      className="h-7 text-xs px-2 text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA] gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Button>

                    {outstanding > 0 && order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'COMPLETED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRecordPayment(order)}
                        className="h-7 text-xs px-2 border-[#ECECEC] dark:border-[#232323] text-[#111111] dark:text-[#FAFAFA] font-medium gap-1"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                        Record Payment
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
