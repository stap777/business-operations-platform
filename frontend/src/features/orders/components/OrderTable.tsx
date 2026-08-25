import React from 'react';
import type { OrderResponse } from '../order.types';
import { OrderStatusBadge, PaymentStatusBadge } from './OrderStatusBadge';
import { ActionDropdownMenu } from '../../../components/common/ActionDropdownMenu';
import type { ActionMenuItem } from '../../../components/common/ActionDropdownMenu';
import { Button } from '../../../components/ui/button';
import { Eye, Lock, Printer, ShieldCheck, XCircle } from 'lucide-react';

interface OrderTableProps {
  orders: OrderResponse[];
  isLoading: boolean;
  onViewOrder: (order: OrderResponse) => void;
  onPrintOrder?: (order: OrderResponse) => void;
  onCancelOrder?: (orderId: number) => void;
  onVerifyOrder?: (order: OrderResponse) => void;
  userRole?: string;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  isLoading,
  onViewOrder,
  onPrintOrder,
  onCancelOrder,
  onVerifyOrder,
  userRole,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-[#FAFAFA] dark:bg-[#151515] animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl p-12 text-center shadow-xs">
        <h3 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">No orders found</h3>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1 max-w-sm mx-auto">
          Customer sales orders will appear here once created. Try adjusting search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Desktop Table View (hidden on small viewports < 640px) */}
      <div className="hidden sm:block bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA]/50 dark:bg-[#151515]/50 text-[#71717A] dark:text-[#A1A1AA] font-semibold text-[10px] uppercase tracking-wider">
                <th className="py-3 px-3.5">Order #</th>
                <th className="py-3 px-3.5">Customer</th>
                <th className="py-3 px-3.5">Date</th>
                <th className="py-3 px-3.5">Sales Rep</th>
                <th className="py-3 px-3.5 text-right">Total</th>
                <th className="py-3 px-3.5 text-right">Paid</th>
                <th className="py-3 px-3.5 text-right">Balance</th>
                <th className="py-3 px-3.5">Payment</th>
                <th className="py-3 px-3.5">Order Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
              {orders.map((order) => {
                const total = order.totalAmount || 0;
                const paid = order.amountReceived || 0;
                const balance = Math.max(0, total - paid);

                const canVerify = userRole === 'ADMIN' && order.orderStatus === 'DELIVERED';
                const canCancel =
                  order.orderStatus !== 'CANCELLED' &&
                  order.orderStatus !== 'COMPLETED' &&
                  order.orderStatus !== 'DELIVERED' &&
                  order.orderStatus !== 'VERIFIED';

                const dropdownItems: ActionMenuItem[] = [
                  {
                    label: 'View Details',
                    icon: Eye,
                    onClick: () => onViewOrder(order),
                  },
                  {
                    label: 'Print Order',
                    icon: Printer,
                    onClick: () => onPrintOrder && onPrintOrder(order),
                  },
                ];

                if (canVerify && onVerifyOrder) {
                  dropdownItems.push({
                    label: 'Verify Order',
                    icon: ShieldCheck,
                    onClick: () => onVerifyOrder(order),
                  });
                }

                if (canCancel && onCancelOrder) {
                  dropdownItems.push({
                    label: 'Cancel Order',
                    icon: XCircle,
                    variant: 'danger',
                    onClick: () => onCancelOrder(order.id),
                  });
                }

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-[#FAFAFA] dark:hover:bg-[#151515] transition-colors"
                  >
                    <td className="py-3 px-3.5 font-mono font-bold text-[#111111] dark:text-[#FAFAFA]">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-3.5 font-medium text-[#111111] dark:text-[#FAFAFA]">
                      {order.customerName}
                      {order.customerCode && (
                        <span className="block text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-mono">
                          {order.customerCode}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[#71717A] dark:text-[#A1A1AA] text-[11px]">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-3.5 text-[#71717A] dark:text-[#A1A1AA] text-[11px]">
                      {order.managerName || 'Unassigned'}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-[#111111] dark:text-[#FAFAFA]">
                      ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      ₹{paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-amber-600 dark:text-amber-400">
                      ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3.5">
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-1.5">
                        <OrderStatusBadge status={order.orderStatus} />
                        {(order.isLocked || order.orderStatus === 'VERIFIED' || order.orderStatus === 'COMPLETED') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewOrder(order)}
                          className="h-7 text-xs font-medium px-2.5 border-[#ECECEC] dark:border-[#232323] hover:bg-[#FAFAFA] dark:hover:bg-[#151515]"
                        >
                          View
                        </Button>
                        <ActionDropdownMenu items={dropdownItems} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View (shown on viewports < 640px) */}
      <div className="sm:hidden space-y-3">
        {orders.map((order) => {
          const total = order.totalAmount || 0;
          const paid = order.amountReceived || 0;
          const balance = Math.max(0, total - paid);

          const canVerify = userRole === 'ADMIN' && order.orderStatus === 'DELIVERED';
          const canCancel =
            order.orderStatus !== 'CANCELLED' &&
            order.orderStatus !== 'COMPLETED' &&
            order.orderStatus !== 'DELIVERED' &&
            order.orderStatus !== 'VERIFIED';

          const dropdownItems: ActionMenuItem[] = [
            {
              label: 'View Details',
              icon: Eye,
              onClick: () => onViewOrder(order),
            },
            {
              label: 'Print Order',
              icon: Printer,
              onClick: () => onPrintOrder && onPrintOrder(order),
            },
          ];

          if (canVerify && onVerifyOrder) {
            dropdownItems.push({
              label: 'Verify Order',
              icon: ShieldCheck,
              onClick: () => onVerifyOrder(order),
            });
          }

          if (canCancel && onCancelOrder) {
            dropdownItems.push({
              label: 'Cancel Order',
              icon: XCircle,
              variant: 'danger',
              onClick: () => onCancelOrder(order.id),
            });
          }

          return (
            <div
              key={order.id}
              className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] p-4 rounded-xl space-y-3 shadow-xs"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-[#111111] dark:text-[#FAFAFA]">
                  {order.orderNumber}
                </span>
                <div className="flex items-center gap-1.5">
                  <OrderStatusBadge status={order.orderStatus} />
                  {(order.isLocked || order.orderStatus === 'VERIFIED' || order.orderStatus === 'COMPLETED') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Customer & Date */}
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-[#111111] dark:text-[#FAFAFA]">
                  {order.customerName}
                </p>
                <div className="flex items-center justify-between text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                  <span>Sales Rep: {order.managerName || 'Unassigned'}</span>
                  <span className="font-mono">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                </div>
              </div>

              {/* Totals & Payment */}
              <div className="p-2.5 rounded-lg bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block uppercase font-medium">Payment Status</span>
                  <PaymentStatusBadge status={order.paymentStatus} />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block uppercase font-medium">Total Amount</span>
                  <span className="font-mono font-bold text-sm text-[#111111] dark:text-[#FAFAFA]">
                    ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  {balance > 0 && (
                    <span className="block text-[10px] font-mono text-amber-600 dark:text-amber-400">
                      Bal: ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-[#ECECEC] dark:border-[#232323]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewOrder(order)}
                  className="h-8 text-xs font-medium px-4 border-[#ECECEC] dark:border-[#232323] flex-1 mr-2"
                >
                  View Details
                </Button>
                <ActionDropdownMenu items={dropdownItems} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
