import type { ProductUnit } from '../products/product.types';

export type OrderStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'VERIFIED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export type DeliveryStatus = 'PENDING' | 'OUT_FOR_DELIVERY' | 'DELIVERED';

export type PaymentMethod = 'CASH' | 'ONLINE' | 'BANK_TRANSFER' | 'CHEQUE' | 'CREDIT' | 'UPI' | 'CARD';

export interface OrderItemResponse {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  sellingPrice: number;
  lineTotal: number;
  unit?: ProductUnit | string;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerCode?: string;
  managerId: number;
  managerName?: string;
  deliveryPersonId?: number | null;
  deliveryPersonName?: string | null;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  subtotal: number;
  discountAmount: number;
  couponCode?: string | null;
  totalAmount: number;
  amountReceived?: number | null;
  paymentMethod?: PaymentMethod | string | null;
  deliveryInstructions?: string | null;
  notes?: string | null;
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemRequest {
  productId: number;
  quantity: number;
}

export interface OrderRequest {
  customerId: number;
  managerId: number;
  deliveryPersonId?: number;
  items: OrderItemRequest[];
  discountAmount?: number;
  couponCode?: string;
  deliveryInstructions?: string;
  notes?: string;
}

export interface OrderQueryParams {
  orderNumber?: string;
  customerId?: number;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export interface OrderPageResponse {
  content: OrderResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface InvoiceItemResponse {
  id: number;
  productNameSnapshot: string;
  quantity: number;
  sellingPriceSnapshot: number;
  lineTotal: number;
}

export interface InvoiceResponse {
  id: number;
  invoiceNumber: string;
  orderId: number;
  orderNumber: string;
  invoiceDate: string;
  customerNameSnapshot: string;
  customerPhoneSnapshot?: string;
  customerAddressSnapshot?: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentReceivedAtGeneration: number;
  generatedById: number;
  generatedByName: string;
  items: InvoiceItemResponse[];
  createdAt: string;
}

export interface PendingVerificationResponse {
  orderId: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerPhone?: string;
  deliveryPersonId?: number | null;
  deliveryPersonName?: string | null;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  itemCount: number;
  deliveredAt: string;
}
