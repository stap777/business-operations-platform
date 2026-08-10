import React from 'react';
import type { DeliveryOrderResponse } from '../delivery.types';
import { DeliveryStatusBadge } from './DeliveryStatusBadge';
import { ChevronRight, MapPin, Package } from 'lucide-react';

interface DeliveryCardProps {
  order: DeliveryOrderResponse;
  onClick: (order: DeliveryOrderResponse) => void;
}

export const DeliveryCard: React.FC<DeliveryCardProps> = ({ order, onClick }) => {
  const itemCount = order.items?.length || 1;
  const itemsText = `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;
  const formattedAmount = `₹${order.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) ?? '0.00'}`;

  return (
    <div
      onClick={() => onClick(order)}
      className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl p-4 shadow-2xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer space-y-3 group"
    >
      {/* Top Row: Order # & Status */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold text-[#111111] dark:text-[#FAFAFA]">
          {order.orderNumber}
        </span>
        <DeliveryStatusBadge status={order.orderStatus} />
      </div>

      {/* Center Details: Customer, Items, Amount */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {order.customerName}
        </h3>

        <div className="flex items-center gap-2 text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono">
          <span className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            {itemsText}
          </span>
          <span>·</span>
          <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">
            {formattedAmount}
          </span>
        </div>
      </div>

      {/* Address & Chevron */}
      <div className="flex items-end justify-between pt-2 border-t border-[#ECECEC] dark:border-[#232323] text-xs">
        <div className="flex items-start gap-1.5 text-[#71717A] dark:text-[#A1A1AA] max-w-[85%]">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span className="line-clamp-1 leading-snug">
            {order.deliveryAddress || 'Address details on file'}
          </span>
        </div>

        <ChevronRight className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
};
