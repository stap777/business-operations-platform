import React from 'react';
import type { OrderResponse } from '../order.types';
import { OrderStatusBadge, PaymentStatusBadge, DeliveryStatusBadge } from './OrderStatusBadge';
import { Button } from '../../../components/ui/button';

interface OrderTableProps {
  orders: OrderResponse[];
  isLoading: boolean;
  onViewOrder: (order: OrderResponse) => void;
  onCancelOrder?: (orderId: number) => void;
  onVerifyOrder?: (order: OrderResponse) => void;
  userRole?: string;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  isLoading,
  onViewOrder,
  onCancelOrder,
  onVerifyOrder,
  userRole,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-[#FAFAFA] dark:bg-[#151515] animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl p-12 text-center shadow-sm">
        <h3 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">No orders found</h3>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1 max-w-sm mx-auto">
          Customer sales orders will appear here once created.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA]/50 dark:bg-[#151515]/50 text-[#71717A] dark:text-[#A1A1AA] font-medium text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Order #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Payment</th>
              <th className="py-3 px-4">Delivery</th>
              <th className="py-3 px-4 text-right">Total Amount</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
            {orders.map((order) => {
              const canVerify = userRole === 'ADMIN' && order.orderStatus === 'DELIVERED';
              const canCancel =
                order.orderStatus !== 'CANCELLED' &&
                order.orderStatus !== 'COMPLETED' &&
                order.orderStatus !== 'DELIVERED' &&
                order.orderStatus !== 'VERIFIED';

              return (
                <tr
                  key={order.id}
                  className="hover:bg-[#FAFAFA] dark:hover:bg-[#151515] transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-semibold text-[#111111] dark:text-[#FAFAFA]">
                    {order.orderNumber}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#111111] dark:text-[#FAFAFA]">
                    {order.customerName}
                    {order.customerCode && (
                      <span className="block text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-mono">
                        {order.customerCode}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#71717A] dark:text-[#A1A1AA]">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    <OrderStatusBadge status={order.orderStatus} />
                  </td>
                  <td className="py-3.5 px-4">
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="py-3.5 px-4">
                    <DeliveryStatusBadge status={order.deliveryStatus} />
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#111111] dark:text-[#FAFAFA]">
                    ₹{order.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) ?? '0.00'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewOrder(order)}
                        className="h-7 text-xs font-medium px-2.5 border-[#ECECEC] dark:border-[#232323] hover:bg-[#FAFAFA] dark:hover:bg-[#151515]"
                      >
                        View
                      </Button>

                      {canVerify && onVerifyOrder && (
                        <Button
                          size="sm"
                          onClick={() => onVerifyOrder(order)}
                          className="h-7 text-xs font-semibold px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs"
                        >
                          Verify
                        </Button>
                      )}

                      {canCancel && onCancelOrder && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCancelOrder(order.id)}
                          className="h-7 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 px-2"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
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
