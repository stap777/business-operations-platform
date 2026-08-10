export type CustomerStatus = 'ACTIVE' | 'INACTIVE';

export interface CustomerResponse {
  id: number;
  customerCode: string;
  fullName: string;
  phoneNumber: string;
  alternatePhoneNumber?: string | null;
  address: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRequest {
  fullName: string;
  phoneNumber: string;
  alternatePhoneNumber?: string | null;
  address: string;
}

export interface CustomerPageResponse {
  content: CustomerResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface CustomerQueryParams {
  query?: string;
  page?: number;
  size?: number;
}

export interface PendingOrderResponse {
  orderId: number;
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number;
  amountPaid: number;
  outstandingAmount: number;
}

export interface LedgerEntryResponse {
  date: string;
  type: string;
  referenceNumber: string;
  debitAmount: number;
  creditAmount: number;
  runningBalance: number;
  remarks: string;
}

export interface CustomerLedgerResponse {
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  totalOrderAmount: number;
  totalPaymentAmount: number;
  outstandingBalance: number;
  entries: LedgerEntryResponse[];
}
