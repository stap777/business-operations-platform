import React from 'react';
import type { OrderResponse } from '../order.types';
import { OrderStatusBadge, PaymentStatusBadge } from './OrderStatusBadge';
import { ActionDropdownMenu } from '../../../components/common/ActionDropdownMenu';
import type { ActionMenuItem } from '../../../components/common/ActionDropdownMenu';
import { Button } from '../../../components/ui/button';
import { Eye, Lock, Printer, ShieldCheck, XCircle, Edit, Trash2 } from 'lucide-react';
import { EmptyState } from '../../../components/common/EmptyState';
import { TableSkeleton } from '../../../components/common/TableSkeleton';

interface OrderTableProps {
  orders: OrderResponse[];
  isLoading: boolean;
  onViewOrder: (order: OrderResponse) => void;
  onEditOrder?: (order: OrderResponse) => void;
  onPrintOrder?: (order: OrderResponse) => void;
  onCancelOrder?: (orderId: number) => void;
  onVerifyOrder?: (order: OrderResponse) => void;
  onDeleteOrder?: (order: OrderResponse) => void;
  userRole?: string;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  isLoading,
  onViewOrder,
  onEditOrder,
  onPrintOrder,
  onCancelOrder,
  onVerifyOrder,
  onDeleteOrder,
  userRole,
}) => {
  if (isLoading) {
    return <TableSkeleton columns={10} rows={8} />;
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No sales orders found"
        description="Customer sales orders will appear here once created. Try adjusting search or filters."
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Desktop Table View (hidden on small viewports < 640px) */}
      <div className="hidden sm:block bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#121214] text-[11px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Sales Rep</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7]/60 dark:divide-[#27272A]/60 text-xs text-[#09090B] dark:text-[#FAFAFA]">
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
                const canEdit =
                  !order.isLocked &&
                  order.orderStatus !== 'VERIFIED' &&
                  order.orderStatus !== 'COMPLETED' &&
                  order.orderStatus !== 'CANCELLED';

                const dropdownItems: ActionMenuItem[] = [
                  {
                    label: 'View Details',
                    icon: Eye,
                    onClick: () => onViewOrder(order),
                  },
                ];

                if (canEdit && onEditOrder) {
                  dropdownItems.push({
                    label: 'Edit Order',
                    icon: Edit,
                    onClick: () => onEditOrder(order),
                  });
                }

                dropdownItems.push({
                  label: 'Print Order',
                  icon: Printer,
                  onClick: () => onPrintOrder && onPrintOrder(order),
                });

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

                if (onDeleteOrder && !order.isLocked && order.orderStatus !== 'VERIFIED') {
                  dropdownItems.push({
                    label: 'Delete Order',
                    icon: Trash2,
                    variant: 'danger',
                    onClick: () => onDeleteOrder(order),
                  });
                }

                return (
                  <tr
                    key={order.id}
                    className="h-14 hover:bg-[#F4F4F5]/60 dark:hover:bg-[#27272A]/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#09090B] dark:text-[#FAFAFA]">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#09090B] dark:text-[#FAFAFA]">
                      {order.customerName}
                      {order.customerCode && (
                        <span className="block text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-mono font-normal">
                          {order.customerCode}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA] text-[11px]">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA]">
                      {order.managerName || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#09090B] dark:text-[#FAFAFA]">
                      ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      ₹{paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-amber-600 dark:text-amber-400">
                      ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 text-right">
                      <ActionDropdownMenu items={dropdownItems} />
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
          const canEdit =
            !order.isLocked &&
            order.orderStatus !== 'VERIFIED' &&
            order.orderStatus !== 'COMPLETED' &&
            order.orderStatus !== 'CANCELLED';

          const dropdownItems: ActionMenuItem[] = [
            {
              label: 'View Details',
              icon: Eye,
              onClick: () => onViewOrder(order),
            },
          ];

          if (canEdit && onEditOrder) {
            dropdownItems.push({
              label: 'Edit Order',
              icon: Edit,
              onClick: () => onEditOrder(order),
            });
          }

          dropdownItems.push({
            label: 'Print Order',
            icon: Printer,
            onClick: () => onPrintOrder && onPrintOrder(order),
          });

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
              className="bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] p-4 rounded-2xl space-y-3 shadow-xs"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-[#09090B] dark:text-[#FAFAFA]">
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
                <p className="font-semibold text-[#09090B] dark:text-[#FAFAFA]">
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
              <div className="p-3 rounded-xl bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block uppercase font-medium mb-0.5">Payment</span>
                  <PaymentStatusBadge status={order.paymentStatus} />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block uppercase font-medium mb-0.5">Total Amount</span>
                  <span className="font-mono font-bold text-sm text-[#09090B] dark:text-[#FAFAFA]">
                    ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  {balance > 0 && (
                    <span className="block text-[10px] font-mono text-amber-600 dark:text-amber-400 font-medium">
                      Bal: ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2.5 border-t border-[#E4E4E7] dark:border-[#27272A]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewOrder(order)}
                  className="h-8 text-xs font-medium px-4 border-[#E4E4E7] dark:border-[#27272A] flex-1 mr-2 rounded-xl"
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
