import { apiClient } from '../../../api/apiClient';
import type {
  SalesReportResponse,
  PaymentReportResponse,
  InventoryReportResponse,
  DeliveryReportResponse,
  AuditLogResponse,
  ReportFilterParams,
} from './report.types';
import type { PageResponse } from '../../dashboard/dashboard.types';

export const reportService = {
  /**
   * Fetch sales report analytics: GET /reports/sales
   */
  getSalesReport: async (params: ReportFilterParams = {}): Promise<SalesReportResponse> => {
    const queryParams: Record<string, any> = {
      granularity: params.granularity || 'DAILY',
    };
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;

    const response = await apiClient.get<SalesReportResponse>('/reports/sales', {
      params: queryParams,
    });
    return response.data;
  },

  /**
   * Fetch payment collection report analytics: GET /reports/payments
   */
  getPaymentReport: async (params: ReportFilterParams = {}): Promise<PaymentReportResponse> => {
    const queryParams: Record<string, any> = {};
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    if (params.paymentMethod) queryParams.paymentMethod = params.paymentMethod;

    const response = await apiClient.get<PaymentReportResponse>('/reports/payments', {
      params: queryParams,
    });
    return response.data;
  },

  /**
   * Fetch inventory valuation & stock report analytics: GET /reports/inventory
   */
  getInventoryReport: async (): Promise<InventoryReportResponse> => {
    const response = await apiClient.get<InventoryReportResponse>('/reports/inventory');
    return response.data;
  },

  /**
   * Fetch delivery operations & agent performance report: GET /reports/deliveries
   */
  getDeliveryReport: async (params: ReportFilterParams = {}): Promise<DeliveryReportResponse> => {
    const queryParams: Record<string, any> = {};
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;

    const response = await apiClient.get<DeliveryReportResponse>('/reports/deliveries', {
      params: queryParams,
    });
    return response.data;
  },

  /**
   * Search audit logs: GET /reports/audit-logs
   */
  getAuditLogs: async (params: ReportFilterParams = {}): Promise<PageResponse<AuditLogResponse>> => {
    const queryParams: Record<string, any> = {
      page: params.page ?? 0,
      size: params.size ?? 20,
    };
    if (params.entityType) queryParams.entityType = params.entityType;
    if (params.action) queryParams.action = params.action;
    if (params.userId) queryParams.userId = params.userId;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;

    const response = await apiClient.get<PageResponse<AuditLogResponse>>('/reports/audit-logs', {
      params: queryParams,
    });
    return response.data;
  },
};
