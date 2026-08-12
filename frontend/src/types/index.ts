export type Role = 'ADMIN' | 'MANAGER' | 'DELIVERY';

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id?: number;
  fullName: string;
  username: string;
  role: Role;
  status?: UserStatus;
  firstLogin?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token?: string;
  username: string;
  role: Role;
  fullName: string;
}

export type CustomerStatus = 'ACTIVE' | 'INACTIVE';

export interface Customer {
  id: number;
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  status: CustomerStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  active: boolean;
}

export type ProductUnit = 'PIECE' | 'KG' | 'LITER' | 'BOX' | 'PACKET';
export type ProductStatus = 'ACTIVE' | 'INACTIVE';

export interface Product {
  id: number;
  sku: string;
  name: string;
  categoryId: number;
  categoryName: string;
  unit: ProductUnit;
  sellingPrice: number;
  costPrice: number;
  availableStock: number;
  reorderLevel: number;
  status: ProductStatus;
}

export type OrderStatus = 'CREATED' | 'ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'VERIFIED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';
export type DeliveryStatus = 'PENDING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED';

export interface OrderItem {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
  sellingPrice: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  managerId: number;
  managerName?: string;
  deliveryPersonId?: number;
  deliveryPersonName?: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
}

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'UPI' | 'CREDIT_CARD';

export interface Payment {
  id: number;
  paymentNumber: string;
  customerId: number;
  customerName: string;
  receivedById: number;
  receivedByName?: string;
  paymentDate: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  remarks?: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  last: boolean;
  first: boolean;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface ActivityLog {
  id: number;
  action: string;
  details: string;
  username: string;
  timestamp: string;
  type: 'ORDER' | 'PAYMENT' | 'DELIVERY' | 'STOCK' | 'INVOICE' | 'SYSTEM';
}

export interface DashboardSummary {
  todaysOrders: number;
  todaysRevenue: number;
  todaysPaymentsReceived: number;
  todaysOutstandingAmount: number;
  todaysDeliveriesPending: number;
  todaysDeliveriesCompleted: number;
  todaysVerifiedOrders: number;
  todaysGeneratedInvoices: number;
  lowStockProductsCount: number;
  totalCustomers: number;
  totalProducts: number;
  totalActiveCoupons: number;
  recentOrders?: Order[];
  lowStockProducts?: Product[];
  pendingPayments?: Partial<Order>[];
  recentActivities?: ActivityLog[];
}

