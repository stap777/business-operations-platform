import type { PaymentStatus, PaymentMethod, OrderStatus } from '../../orders/order.types';

export type { PaymentStatus, PaymentMethod };

export interface PaymentAllocationRequest {
  orderId: number;
  allocatedAmount: number;
}

export interface PaymentRequest {
  customerId: number;
  paymentDate?: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  remarks?: string;
  allocations: PaymentAllocationRequest[];
}

export interface PaymentAllocationResponse {
  id: number;
  orderId: number;
  orderNumber: string;
  allocatedAmount: number;
  outstandingBefore: number;
  outstandingAfter: number;
}

export interface PaymentResponse {
  id: number;
  paymentNumber: string;
  customerId: number;
  customerName: string;
  receivedById: number;
  receivedByName: string;
  paymentDate: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  remarks?: string;
  allocations: PaymentAllocationResponse[];
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentFilterParams {
  page?: number;
  size?: number;
  orderNumber?: string;
  customerId?: number;
  status?: PaymentStatus;
  orderStatus?: OrderStatus;
  startDate?: string;
  endDate?: string;
}

export interface CreditOrderSummary {
  orderId: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerCode?: string;
  customerPhone?: string;
  orderTotal: number;
  amountPaid: number;
  outstandingAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
}

export interface SuggestedAllocationItem {
  orderId: number;
  orderNumber: string;
  allocatedAmount: number;
  outstandingBalanceBefore: number;
  outstandingBalanceAfter: number;
}

export interface PaymentSuggestionResponse {
  customerId: number;
  customerName: string;
  paymentAmount: number;
  remainingUnallocatedAmount: number;
  suggestedAllocations: SuggestedAllocationItem[];
}
