import { useQuery } from '@tanstack/react-query';
import { dashboardService } from './dashboardService';

export const dashboardKeys = {
  summary: ['dashboard', 'summary'] as const,
  salesReport: (granularity: string) => ['reports', 'sales', granularity] as const,
  deliveryReport: ['reports', 'deliveries'] as const,
  inventoryReport: ['reports', 'inventory'] as const,
  auditLogs: (size: number) => ['reports', 'auditLogs', size] as const,
};

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: dashboardKeys.summary,
    queryFn: () => dashboardService.getSummary(),
    staleTime: 30_000,
    retry: 1,
  });
};

export const useSalesReport = (granularity: string = 'DAILY') => {
  return useQuery({
    queryKey: dashboardKeys.salesReport(granularity),
    queryFn: () => dashboardService.getSalesReport(granularity),
    staleTime: 30_000,
    retry: 1,
  });
};

export const useDeliveryReport = () => {
  return useQuery({
    queryKey: dashboardKeys.deliveryReport,
    queryFn: () => dashboardService.getDeliveryReport(),
    staleTime: 30_000,
    retry: 1,
  });
};

export const useInventoryReport = () => {
  return useQuery({
    queryKey: dashboardKeys.inventoryReport,
    queryFn: () => dashboardService.getInventoryReport(),
    staleTime: 30_000,
    retry: 1,
  });
};

export const useAuditLogs = (size: number = 5, enabled: boolean = true) => {
  return useQuery({
    queryKey: dashboardKeys.auditLogs(size),
    queryFn: () => dashboardService.getAuditLogs(size),
    staleTime: 30_000,
    retry: false,
    enabled,
  });
};
