import React, { useState } from 'react';
import { useCreditOrders } from './hooks/usePayments';
import type { PaymentStatus } from './payment.types';
import type { OrderResponse } from '../../orders/order.types';
import { PaymentFilters } from './components/PaymentFilters';
import { PaymentTable } from './components/PaymentTable';
import { PaymentDetailsModal } from './components/PaymentDetailsModal';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { CreditCard, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';

export const AdminPaymentsPage: React.FC = () => {
  const [page, setPage] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    'ALL_OUTSTANDING' | PaymentStatus | 'ALL'
  >('ALL_OUTSTANDING');

  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderResponse | null>(null);
  const [selectedOrderRecordPayment, setSelectedOrderRecordPayment] = useState<OrderResponse | null>(
    null
  );

  // Build backend search filters
  const filterParams = {
    page,
    size: 15,
    orderNumber: search || undefined,
  };

  const { data: pageData, isLoading, isFetching, isError, refetch } = useCreditOrders(filterParams);

  const rawOrders = pageData?.content || [];

  // Filter orders according to selectedStatusFilter
  const filteredOrders = rawOrders.filter((order) => {
    const total = order.totalAmount || 0;
    const paid = order.amountReceived || 0;
    const outstanding = total - paid;

    if (selectedStatusFilter === 'ALL_OUTSTANDING') {
      return outstanding > 0 && order.paymentStatus !== 'PAID';
    }
    if (selectedStatusFilter === 'PENDING') {
      return order.paymentStatus === 'PENDING';
    }
    if (selectedStatusFilter === 'PARTIAL') {
      return order.paymentStatus === 'PARTIAL';
    }
    if (selectedStatusFilter === 'PAID') {
      return order.paymentStatus === 'PAID';
    }
    return true; // ALL
  });

  const totalPages = pageData?.totalPages || 0;
  const totalElements = pageData?.totalElements || 0;

  // Calculate total outstanding balance across current list
  const totalOutstandingBalance = filteredOrders.reduce((sum, order) => {
    const total = order.totalAmount || 0;
    const paid = order.amountReceived || 0;
    return sum + Math.max(0, total - paid);
  }, 0);

  const formatCurrency = (val: number = 0) => {
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ECECEC] dark:border-[#232323]">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#111111] dark:text-[#FAFAFA]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-[#FAFAFA]">
              Customer Receivables & Payments
            </h1>
          </div>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            Track outstanding order balances and record customer payment allocations.
          </p>
        </div>

        {/* Quiet Summary Badge */}
        <div className="p-3 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] flex items-center gap-3">
          <div>
            <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider">
              Filtered Outstanding
            </span>
            <p className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
              {formatCurrency(totalOutstandingBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <PaymentFilters
        onSearchChange={(val) => {
          setSearch(val);
          setPage(0);
        }}
        selectedStatus={selectedStatusFilter}
        onStatusChange={(val) => {
          setSelectedStatusFilter(val);
          setPage(0);
        }}
        onRefresh={() => refetch()}
        isFetching={isFetching}
      />

      {/* Error View */}
      {isError ? (
        <div className="p-8 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl space-y-3">
          <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-semibold text-xs">
            <AlertCircle className="w-4 h-4" />
            Unable to load credit orders from backend.
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs border-red-200 dark:border-red-800/50"
          >
            Retry
          </Button>
        </div>
      ) : (
        /* Primary Table */
        <div className="space-y-4">
          <PaymentTable
            orders={filteredOrders}
            isLoading={isLoading}
            onViewDetails={(order) => setSelectedOrderDetails(order)}
            onRecordPayment={(order) => setSelectedOrderRecordPayment(order)}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-[#71717A] dark:text-[#A1A1AA]">
              <div>
                Showing page <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{page + 1}</span> of{' '}
                <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{totalPages}</span> ({totalElements} total orders)
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0 || isLoading}
                  onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                  className="h-8 text-xs font-medium gap-1 border-[#ECECEC] dark:border-[#232323]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1 || isLoading}
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
      )}

      {/* Details Modal */}
      <PaymentDetailsModal
        order={selectedOrderDetails}
        isOpen={!!selectedOrderDetails}
        onClose={() => setSelectedOrderDetails(null)}
        onOpenRecordPayment={(order) => {
          setSelectedOrderRecordPayment(order);
        }}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        order={selectedOrderRecordPayment}
        isOpen={!!selectedOrderRecordPayment}
        onClose={() => setSelectedOrderRecordPayment(null)}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
};

export default AdminPaymentsPage;
