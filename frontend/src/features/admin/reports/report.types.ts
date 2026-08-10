import type { PaymentMethod, PaymentStatus } from '../../orders/order.types';

export interface SalesPeriodItemResponse {
  periodLabel: string;
  totalOrders: number;
  revenue: number;
  discountGiven: number;
  averageOrderValue: number;
  cogs?: number;
  grossProfit?: number;
  profitMarginPercentage?: number;
  completedOrders: number;
  cancelledOrders: number;
}

export interface SalesReportResponse {
  granularity: string;
  totalOrders: number;
  totalRevenue: number;
  totalDiscountGiven: number;
  averageOrderValue: number;
  totalCogs?: number;
  grossProfit?: number;
  profitMarginPercentage?: number;
  completedOrders: number;
  cancelledOrders: number;
  items: SalesPeriodItemResponse[];
}

export interface PaymentMethodSummaryResponse {
  paymentMethod: PaymentMethod | string;
  transactionCount: number;
  totalAmount: number;
}

export interface PaymentItemResponse {
  id: number;
  orderId: number;
  orderNumber: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod | string;
  paymentStatus: PaymentStatus | string;
  transactionReference?: string;
  receivedAt: string;
}

export interface PaymentReportResponse {
  totalPaymentsReceived: number;
  totalOutstandingAmount: number;
  totalTransactions: number;
  methodSummaries: PaymentMethodSummaryResponse[];
  recentPayments?: PaymentItemResponse[];
}

export interface ReportProductItem {
  id: number;
  sku: string;
  name: string;
  categoryName?: string;
  purchasePrice?: number;
  sellingPrice: number;
  availableStock: number;
  minimumStock: number;
  unit: string;
  status: string;
}

export interface StockAdjustmentItem {
  id: number;
  productName: string;
  adjustmentType: string;
  quantityChange: number;
  reason: string;
  performedByName: string;
  createdAt: string;
}

export interface InventoryReportResponse {
  totalProducts: number;
  totalLowStockCount: number;
  totalOutOfStockCount: number;
  totalInventoryValuation: number;
  lowStockProducts: ReportProductItem[];
  outOfStockProducts: ReportProductItem[];
  recentAdjustments?: StockAdjustmentItem[];
}

export interface DeliveryAgentPerformanceResponse {
  deliveryPersonId: number;
  deliveryPersonName: string;
  totalAssigned: number;
  pendingDeliveries: number;
  completedDeliveries: number;
}

export interface DeliveryReportResponse {
  deliveriesToday: number;
  pendingDeliveries: number;
  completedDeliveries: number;
  agentPerformanceList: DeliveryAgentPerformanceResponse[];
}

export interface AuditLogResponse {
  id: number;
  entityType: string;
  entityId?: number;
  action: string;
  performedById?: number;
  performedByName: string;
  performedAt: string;
  remarks?: string;
}

export interface ReportFilterParams {
  startDate?: string;
  endDate?: string;
  granularity?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  paymentMethod?: string;
  entityType?: string;
  action?: string;
  userId?: number;
  page?: number;
  size?: number;
}
