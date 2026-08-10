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
}

export interface SalesPeriodItem {
  periodLabel: string;
  totalOrders: number;
  revenue: number;
  discountGiven: number;
  averageOrderValue: number;
  completedOrders: number;
  cancelledOrders: number;
}

export interface SalesReportResponse {
  granularity: string;
  totalOrders: number;
  totalRevenue: number;
  totalDiscountGiven: number;
  averageOrderValue: number;
  completedOrders: number;
  cancelledOrders: number;
  items: SalesPeriodItem[];
}

export interface DeliveryAgentPerformance {
  agentId: number;
  agentName: string;
  completedCount: number;
  pendingCount: number;
}

export interface DeliveryReportResponse {
  deliveriesToday: number;
  pendingDeliveries: number;
  completedDeliveries: number;
  agentPerformanceList: DeliveryAgentPerformance[];
}

export interface ProductItem {
  id: number;
  sku: string;
  name: string;
  categoryId?: number;
  categoryName?: string;
  purchasePrice?: number;
  sellingPrice: number;
  availableStock: number;
  minimumStock: number;
  unit: string;
  status: string;
}

export interface InventoryReportResponse {
  totalProducts: number;
  totalLowStockCount: number;
  totalOutOfStockCount: number;
  totalInventoryValuation: number;
  lowStockProducts: ProductItem[];
  outOfStockProducts: ProductItem[];
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

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
