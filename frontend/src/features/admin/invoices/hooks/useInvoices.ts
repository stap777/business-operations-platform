import { useQuery } from '@tanstack/react-query';
import { invoiceService } from '../invoiceService';
import type { InvoiceQueryParams } from '../invoice.types';

export const invoiceKeys = {
  all: ['invoices'] as const,
  list: (params?: InvoiceQueryParams) => [...invoiceKeys.all, 'list', params] as const,
  detail: (id?: number) => [...invoiceKeys.all, 'detail', id] as const,
};

export const useInvoices = (params: InvoiceQueryParams = {}) => {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => invoiceService.searchInvoices(params),
    staleTime: 60_000,
  });
};

export const useInvoiceDetails = (id?: number | null) => {
  return useQuery({
    queryKey: invoiceKeys.detail(id ?? undefined),
    queryFn: () => (id ? invoiceService.getInvoiceById(id) : Promise.reject('No ID')),
    enabled: !!id,
    staleTime: 300_000,
  });
};
