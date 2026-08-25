import type { PaymentStatus } from '../../orders/order.types';

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
  paidAmount?: number;
  creditRemaining?: number;
  paymentMethod?: string;
  logoUrl?: string;
  enterpriseName?: string;
  enterpriseAddress?: string;
  enterprisePhone?: string;
  invoiceFooter?: string;
  generatedById: number;
  generatedByName: string;
  items: InvoiceItemResponse[];
  createdAt: string;
}

export interface InvoiceQueryParams {
  query?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export interface InvoicePageResponse {
  content: InvoiceResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
