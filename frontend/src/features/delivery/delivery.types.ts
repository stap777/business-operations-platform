import type { OrderStatus, PaymentStatus, DeliveryStatus, PaymentMethod, OrderItemResponse } from '../orders/order.types';

export type { OrderStatus, PaymentStatus, DeliveryStatus, PaymentMethod };

export interface DeliveryPaymentRequest {
  amountReceived: number;
  paymentMethod: PaymentMethod;
}

export interface DeliveryOrderResponse {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerCode?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  managerId?: number;
  managerName?: string;
  deliveryPersonId?: number | null;
  deliveryPersonName?: string | null;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  amountReceived?: number | null;
  paymentMethod?: PaymentMethod | string | null;
  deliveryInstructions?: string | null;
  notes?: string | null;
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryPageResponse {
  content: DeliveryOrderResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface DeliveryQueryParams {
  status?: OrderStatus | string;
  query?: string;
  page?: number;
  size?: number;
}
