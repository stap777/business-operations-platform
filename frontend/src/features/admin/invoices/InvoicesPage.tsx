import React, { useState } from 'react';
import type { InvoiceResponse } from './invoice.types';
import { useInvoices } from './hooks/useInvoices';
import { useBusinessSettings } from '../settings/hooks/useBusinessSettings';
import { invoiceService } from './invoiceService';
import { InvoiceFilters } from './components/InvoiceFilters';
import { InvoiceTable } from './components/InvoiceTable';
import { InvoiceDetailsModal } from './components/InvoiceDetailsModal';
import { BulkPrintModal } from './components/BulkPrintModal';
import { PrintableInvoices } from './components/PrintableInvoices';
import { Button } from '../../../components/ui/button';
import { ChevronLeft, ChevronRight, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner';

export const InvoicesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [page, setPage] = useState<number>(0);

  // Single Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceResponse | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

  // Bulk Print State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [isPreparingBulkPrint, setIsPreparingBulkPrint] = useState<boolean>(false);
  const [bulkLoadedCount, setBulkLoadedCount] = useState<number>(0);
  const [bulkErrorMessage, setBulkErrorMessage] = useState<string | null>(null);
  const [bulkPrintInvoices, setBulkPrintInvoices] = useState<InvoiceResponse[] | null>(null);

  // React Query Hooks
  const {
    data: invoiceData,
    isLoading,
    isError,
    refetch,
  } = useInvoices({
    query: searchQuery,
    startDate,
    endDate,
    page,
    size: 20,
  });

  const { data: businessSettings } = useBusinessSettings();

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(0);
  };

  const handleDateRangeChange = (start?: string, end?: string) => {
    setStartDate(start);
    setEndDate(end);
    setPage(0);
  };

  const handleViewInvoice = (invoice: InvoiceResponse) => {
    setSelectedInvoice(invoice);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedInvoice(null);
  };

  const handleOpenBulkPrint = () => {
    const total = invoiceData?.totalElements || 0;
    if (total === 0) {
      toast.info('No invoices to print matching current filters.');
      return;
    }
    setBulkErrorMessage(null);
    setBulkLoadedCount(0);
    setIsBulkModalOpen(true);
  };

  const handleExecuteBulkPrint = async () => {
    setIsPreparingBulkPrint(true);
    setBulkErrorMessage(null);
    setBulkLoadedCount(0);

    try {
      const allMatching = await invoiceService.fetchAllMatchingInvoices(
        {
          query: searchQuery,
          startDate,
          endDate,
        },
        (loaded) => {
          setBulkLoadedCount(loaded);
        }
      );

      setBulkPrintInvoices(allMatching);
      setIsPreparingBulkPrint(false);
      setIsBulkModalOpen(false);

      // Trigger print after rendering bulk printable invoices DOM
      setTimeout(() => {
        window.print();
      }, 150);
    } catch (err: any) {
      setIsPreparingBulkPrint(false);
      const msg = err?.response?.data?.message || err?.message || 'Failed to prepare all invoices for printing.';
      setBulkErrorMessage(msg);
    }
  };

  const invoices = invoiceData?.content || [];
  const totalPages = invoiceData?.totalPages || 0;
  const totalElements = invoiceData?.totalElements || 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ECECEC] dark:border-[#232323]">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#111111] dark:text-[#FAFAFA]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-[#FAFAFA]">
              Invoices
            </h1>
          </div>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            View and print generated business invoices.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Toolbar Filters */}
        <InvoiceFilters
          onSearchChange={handleSearchChange}
          onDateRangeChange={handleDateRangeChange}
          onPrintAll={handleOpenBulkPrint}
          isPreparingPrint={isPreparingBulkPrint}
          totalResults={totalElements}
          initialQuery={searchQuery}
          initialStartDate={startDate}
          initialEndDate={endDate}
        />

        {/* Error State */}
        {isError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
            <span>Unable to load invoices from server. Please check your connection or retry.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs h-7 gap-1 border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/50"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </Button>
          </div>
        )}

        {/* Data Table */}
        <InvoiceTable
          invoices={invoices}
          isLoading={isLoading}
          onViewInvoice={handleViewInvoice}
        />

        {/* Pagination Controls */}
        {invoiceData && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-[#71717A] dark:text-[#A1A1AA]">
            <div>
              Showing page <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{invoiceData.number + 1}</span> of{' '}
              <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{totalPages}</span> ({totalElements} records)
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={invoiceData.first || isLoading}
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                className="h-8 text-xs font-medium gap-1 border-[#ECECEC] dark:border-[#232323]"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={invoiceData.last || isLoading}
                onClick={() => setPage((prev) => prev + 1)}
                className="h-8 text-xs font-medium gap-1 border-[#ECECEC] dark:border-[#232323]"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Single Invoice Details & Print Modal */}
      <InvoiceDetailsModal
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        invoice={selectedInvoice}
        businessSettings={businessSettings}
      />

      {/* Bulk Print Confirmation & Progress Modal */}
      <BulkPrintModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onConfirm={handleExecuteBulkPrint}
        totalCount={totalElements}
        isPreparing={isPreparingBulkPrint}
        loadedCount={bulkLoadedCount}
        errorMessage={bulkErrorMessage}
        searchQuery={searchQuery}
        startDate={startDate}
        endDate={endDate}
      />

      {/* Hidden Bulk Print Container Rendered Exclusively During Bulk Print */}
      {bulkPrintInvoices && bulkPrintInvoices.length > 0 && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999]">
          <PrintableInvoices invoices={bulkPrintInvoices} businessSettings={businessSettings} />
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
