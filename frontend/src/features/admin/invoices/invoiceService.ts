import { apiClient } from '../../../api/apiClient';
import type {
  InvoiceQueryParams,
  InvoicePageResponse,
  InvoiceResponse,
} from './invoice.types';

export const invoiceService = {
  /**
   * Search paginated admin invoices: GET /admin/invoices/search
   */
  searchInvoices: async (params: InvoiceQueryParams = {}): Promise<InvoicePageResponse> => {
    const { query, startDate, endDate, page = 0, size = 20 } = params;
    const queryParams: Record<string, any> = { page, size };

    if (query && query.trim() !== '') {
      queryParams.query = query.trim();
    }
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;

    const response = await apiClient.get<InvoicePageResponse>('/admin/invoices/search', {
      params: queryParams,
    });
    return response.data;
  },

  /**
   * Get single invoice details by ID: GET /admin/invoices/{id}
   */
  getInvoiceById: async (id: number): Promise<InvoiceResponse> => {
    const response = await apiClient.get<InvoiceResponse>(`/admin/invoices/${id}`);
    return response.data;
  },

  /**
   * Fetch all invoices matching current search/date filters sequentially across all pages.
   * Reports progress via callback for responsive UI feedback.
   */
  fetchAllMatchingInvoices: async (
    params: Omit<InvoiceQueryParams, 'page' | 'size'> = {},
    onProgress?: (loaded: number, total: number) => void
  ): Promise<InvoiceResponse[]> => {
    const pageSize = 50; // Safe standard backend page size
    const firstPage = await invoiceService.searchInvoices({ ...params, page: 0, size: pageSize });

    let allInvoices: InvoiceResponse[] = [...firstPage.content];
    const totalElements = firstPage.totalElements;
    const totalPages = firstPage.totalPages;

    if (onProgress) {
      onProgress(allInvoices.length, totalElements);
    }

    for (let p = 1; p < totalPages; p++) {
      const pageData = await invoiceService.searchInvoices({ ...params, page: p, size: pageSize });
      allInvoices = allInvoices.concat(pageData.content);
      if (onProgress) {
        onProgress(allInvoices.length, totalElements);
      }
    }

    return allInvoices;
  },
};
