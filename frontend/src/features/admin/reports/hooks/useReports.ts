import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../reportService';
import type { ReportFilterParams, OperatingExpenseRequest } from '../report.types';

export const reportKeys = {
  all: ['reports'] as const,
  unified: (params?: ReportFilterParams) => [...reportKeys.all, 'unified', params] as const,
  expenses: (params?: ReportFilterParams) => [...reportKeys.all, 'expenses', params] as const,
  sales: (params?: ReportFilterParams) => [...reportKeys.all, 'sales', params] as const,
  payments: (params?: ReportFilterParams) => [...reportKeys.all, 'payments', params] as const,
  inventory: () => [...reportKeys.all, 'inventory'] as const,
  deliveries: (params?: ReportFilterParams) => [...reportKeys.all, 'deliveries', params] as const,
  auditLogs: (params?: ReportFilterParams) => [...reportKeys.all, 'auditLogs', params] as const,
};

export const useUnifiedReport = (params: ReportFilterParams = {}) => {
  return useQuery({
    queryKey: reportKeys.unified(params),
    queryFn: () => reportService.getUnifiedReport(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useOperatingExpenses = (params: ReportFilterParams = {}) => {
  return useQuery({
    queryKey: reportKeys.expenses(params),
    queryFn: () => reportService.getOperatingExpenses(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateOperatingExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OperatingExpenseRequest) => reportService.createOperatingExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
};

export const useUpdateOperatingExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: OperatingExpenseRequest }) =>
      reportService.updateOperatingExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
};

export const useDeleteOperatingExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reportService.deleteOperatingExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
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
