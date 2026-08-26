import React from 'react';
import type { OrderStatus, PaymentStatus, DeliveryStatus } from '../order.types';
import { StatusBadge } from '../../../components/common/StatusBadge';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  return <StatusBadge status={status} size="sm" />;
};

export const PaymentStatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  return <StatusBadge status={status} size="sm" />;
};

export const DeliveryStatusBadge: React.FC<{ status: DeliveryStatus }> = ({ status }) => {
  return <StatusBadge status={status} size="sm" />;
};
