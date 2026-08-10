import { useQuery } from '@tanstack/react-query';
import { reportService } from '../reportService';
import type { ReportFilterParams } from '../report.types';

export const reportKeys = {
  all: ['reports'] as const,
  sales: (params?: ReportFilterParams) => [...reportKeys.all, 'sales', params] as const,
  payments: (params?: ReportFilterParams) => [...reportKeys.all, 'payments', params] as const,
  inventory: () => [...reportKeys.all, 'inventory'] as const,
  deliveries: (params?: ReportFilterParams) => [...reportKeys.all, 'deliveries', params] as const,
  auditLogs: (params?: ReportFilterParams) => [...reportKeys.all, 'auditLogs', params] as const,
};

export const useSalesReport = (params: ReportFilterParams = {}) => {
  return useQuery({
    queryKey: reportKeys.sales(params),
    queryFn: () => reportService.getSalesReport(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const usePaymentReport = (params: ReportFilterParams = {}) => {
  return useQuery({
    queryKey: reportKeys.payments(params),
    queryFn: () => reportService.getPaymentReport(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useInventoryReport = () => {
  return useQuery({
    queryKey: reportKeys.inventory(),
    queryFn: () => reportService.getInventoryReport(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useDeliveryReport = (params: ReportFilterParams = {}) => {
  return useQuery({
    queryKey: reportKeys.deliveries(params),
    queryFn: () => reportService.getDeliveryReport(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useAuditLogsReport = (params: ReportFilterParams = {}, enabled: boolean = true) => {
  return useQuery({
    queryKey: reportKeys.auditLogs(params),
    queryFn: () => reportService.getAuditLogs(params),
    enabled,
    staleTime: 2 * 60 * 1000,
  });
};
