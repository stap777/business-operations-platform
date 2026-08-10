import { apiClient } from '../../api/apiClient';
import type {
  DashboardSummary,
  SalesReportResponse,
  DeliveryReportResponse,
  InventoryReportResponse,
  AuditLogResponse,
  PageResponse,
} from './dashboard.types';

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await apiClient.get<DashboardSummary>('/dashboard/summary');
    return response.data;
  },

  getSalesReport: async (
    granularity: string = 'DAILY',
    startDate?: string,
    endDate?: string
  ): Promise<SalesReportResponse> => {
    const params: Record<string, string> = { granularity };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await apiClient.get<SalesReportResponse>('/reports/sales', { params });
    return response.data;
  },

  getDeliveryReport: async (): Promise<DeliveryReportResponse> => {
    const response = await apiClient.get<DeliveryReportResponse>('/reports/deliveries');
    return response.data;
  },

  getInventoryReport: async (): Promise<InventoryReportResponse> => {
    const response = await apiClient.get<InventoryReportResponse>('/reports/inventory');
    return response.data;
  },

  getAuditLogs: async (size: number = 5): Promise<PageResponse<AuditLogResponse>> => {
    const response = await apiClient.get<PageResponse<AuditLogResponse>>('/reports/audit-logs', {
      params: { size, sort: 'performedAt,desc' },
    });
    return response.data;
  },
};
