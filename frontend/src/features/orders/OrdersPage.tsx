import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { OrderResponse, OrderStatus, OrderRequest } from './order.types';
import { useOrders, useCancelOrder, useVerifyOrder, usePendingVerificationOrders, useUpdateOrder } from './hooks/useOrders';
import { useAuth } from '../../context/AuthContext';
import { useBusinessSettings } from '../admin/settings/hooks/useBusinessSettings';
import { OrderFilters } from './components/OrderFilters';
import { OrderTable } from './components/OrderTable';
import { OrderDetailsModal } from './components/OrderDetailsModal';
import { EditOrderModal } from './components/EditOrderModal';
import { PrintableOrder } from './components/PrintableOrder';
import { Button } from '../../components/ui/button';
import { DispatchSheetModal } from '../admin/dispatch/components/DispatchSheetModal';
import { Plus, ChevronLeft, ChevronRight, RefreshCw, ClipboardList, CheckCircle2, ClipboardCheck, Filter } from 'lucide-react';

export type QuickFilter = 'ALL' | 'TODAY' | 'PENDING' | 'DELIVERED' | 'CASH' | 'UPI' | 'CREDIT';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: businessSettings } = useBusinessSettings();
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING_VERIFICATION'>('ALL');
  const [searchOrderNumber, setSearchOrderNumber] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | undefined>(undefined);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('ALL');
  const [page, setPage] = useState<number>(0);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [printOrderData, setPrintOrderData] = useState<OrderResponse | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<OrderResponse | null>(null);

  // React Query Hooks
  const {
    data: ordersData,
    isLoading,
    refetch,
  } = useOrders({
    orderNumber: searchOrderNumber,
    status: selectedStatus,
    startDate,
    endDate,
    page,
    size: 50,
  });

  const {
    data: pendingData,
    isLoading: isPendingLoading,
  } = usePendingVerificationOrders(page, 50);

  const cancelOrderMutation = useCancelOrder();
  const verifyOrderMutation = useVerifyOrder();
  const updateOrderMutation = useUpdateOrder();

  const handleQuickFilterChange = (filter: QuickFilter) => {
    setQuickFilter(filter);
    setPage(0);
    const todayStr = new Date().toISOString().split('T')[0];

    if (filter === 'TODAY') {
      setStartDate(todayStr);
      setEndDate(todayStr);
      setSelectedStatus(undefined);
    } else if (filter === 'PENDING') {
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedStatus(undefined);
    } else if (filter === 'DELIVERED') {
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedStatus('DELIVERED');
    } else if (filter === 'ALL') {
      setSearchOrderNumber('');
      setSelectedStatus(undefined);
      setStartDate(undefined);
      setEndDate(undefined);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchOrderNumber(query);
    setPage(0);
  };

  const handleStatusChange = (status?: OrderStatus) => {
    setSelectedStatus(status);
    setQuickFilter('ALL');
    setPage(0);
  };

  const handleDateRangeChange = (start?: string, end?: string) => {
    setStartDate(start);
    setEndDate(end);
    setQuickFilter('ALL');
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchOrderNumber('');
    setSelectedStatus(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
    setQuickFilter('ALL');
    setPage(0);
  };

  const handleViewOrder = (order: OrderResponse) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleEditOrder = (order: OrderResponse) => {
    setOrderToEdit(order);
  };

  const handleUpdateOrderSubmit = (orderId: number, data: OrderRequest) => {
    updateOrderMutation.mutate(
      { id: orderId, data },
      {
        onSuccess: () => {
          setOrderToEdit(null);
        },
      }
    );
  };

  const handlePrintOrder = (order: OrderResponse) => {
    setPrintOrderData(order);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedOrder(null);
  };

  const handleCancelOrder = (id: number) => {
    cancelOrderMutation.mutate(id, {
      onSuccess: () => {
        if (selectedOrder?.id === id) {
          handleCloseDetails();
        }
      },
    });
  };

  const handleVerifyOrder = (orderOrId: OrderResponse | number) => {
    const id = typeof orderOrId === 'number' ? orderOrId : orderOrId.id;
    verifyOrderMutation.mutate(id, {
      onSuccess: () => {
        if (selectedOrder?.id === id) {
          handleCloseDetails();
        }
      },
    });
  };

  const rawOrders = ordersData?.content || [];

  // Filter payment methods & pending states on client side
  const filteredOrders = useMemo(() => {
    if (quickFilter === 'PENDING') {
      return rawOrders.filter(
        (o) =>
          o.orderStatus !== 'DELIVERED' &&
          o.orderStatus !== 'COMPLETED' &&
          o.orderStatus !== 'CANCELLED'
      );
    }
    if (quickFilter === 'CASH') {
      return rawOrders.filter((o) => o.paymentMethod?.toUpperCase().includes('CASH'));
    }
    if (quickFilter === 'UPI') {
      return rawOrders.filter((o) => o.paymentMethod?.toUpperCase().includes('UPI'));
    }
    if (quickFilter === 'CREDIT') {
      return rawOrders.filter((o) => o.paymentMethod?.toUpperCase().includes('CREDIT'));
    }
    return rawOrders;
  }, [rawOrders, quickFilter]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const filterCounts = useMemo(() => {
    let todayCount = 0;
    let pendingCount = 0;
    let deliveredCount = 0;
    let cashCount = 0;
    let upiCount = 0;
    let creditCount = 0;

    rawOrders.forEach((o) => {
      if (o.createdAt && o.createdAt.startsWith(todayStr)) {
        todayCount++;
      }
      if (
        o.orderStatus !== 'DELIVERED' &&
        o.orderStatus !== 'COMPLETED' &&
        o.orderStatus !== 'CANCELLED'
      ) {
        pendingCount++;
      }
      if (o.orderStatus === 'DELIVERED') {
        deliveredCount++;
      }
      const pay = o.paymentMethod?.toUpperCase() || '';
      if (pay.includes('CASH')) cashCount++;
      if (pay.includes('UPI')) upiCount++;
      if (pay.includes('CREDIT')) creditCount++;
    });

    return {
      ALL: rawOrders.length,
      TODAY: todayCount,
      PENDING: pendingCount,
      DELIVERED: deliveredCount,
      CASH: cashCount,
      UPI: upiCount,
      CREDIT: creditCount,
    };
  }, [rawOrders, todayStr]);

  const totalPages = ordersData?.totalPages || 0;
  const totalElements = filteredOrders.length;

  return (
    <div className="space-y-6 pb-8">
      {/* Printable Order Container (rendered on window.print()) */}
      <PrintableOrder
        order={printOrderData || selectedOrder}
        businessSettings={businessSettings}
      />

      {/* Screen Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ECECEC] dark:border-[#232323] print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#111111] dark:text-[#FAFAFA]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-[#FAFAFA]">
              Orders Management
            </h1>
          </div>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            Inspect customer sales orders, track payment & fulfillment status, and generate printable orders.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDispatchModalOpen(true)}
            className="border-[#ECECEC] dark:border-[#232323] text-[#111111] dark:text-[#FAFAFA] text-xs font-semibold px-3 py-2 rounded-lg gap-1.5 cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Print Dispatch Sheet
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/orders/create')}
            className="bg-[#111111] text-white dark:bg-[#FAFAFA] dark:text-[#111111] hover:opacity-90 text-xs font-semibold px-4 py-2 rounded-lg shadow-2xs gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Order
          </Button>
        </div>
      </div>

      {/* Sticky Quick Filter Chips with Result Counts */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#0F0F0F]/95 backdrop-blur-md py-2.5 border-y border-[#ECECEC] dark:border-[#232323] -mx-4 px-4 sm:-mx-6 sm:px-6 print:hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Quick:
          </span>
          {[
            { id: 'ALL', label: 'ALL' },
            { id: 'TODAY', label: 'TODAY' },
            { id: 'PENDING', label: 'PENDING' },
            { id: 'DELIVERED', label: 'DELIVERED' },
            { id: 'CASH', label: 'CASH' },
            { id: 'UPI', label: 'UPI' },
            { id: 'CREDIT', label: 'CREDIT' },
          ].map((chip) => {
            const isActive = quickFilter === chip.id;
            const count = filterCounts[chip.id as QuickFilter] ?? 0;
            return (
              <button
                key={chip.id}
                onClick={() => handleQuickFilterChange(chip.id as QuickFilter)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1 shrink-0 ${
                  isActive
                    ? 'bg-[#111111] text-white border-[#111111] dark:bg-[#FAFAFA] dark:text-[#111111] dark:border-[#FAFAFA] shadow-xs'
                    : 'bg-white dark:bg-[#1A1A1A] text-[#71717A] dark:text-[#A1A1AA] border-[#ECECEC] dark:border-[#232323] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
                }`}
              >
                <span>{chip.label}</span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  • {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main View Container */}
      <div className="space-y-4 print:hidden">
        {/* Admin Workflow Navigation Tabs */}
        {user?.role === 'ADMIN' && (
          <div className="flex items-center gap-1 border-b border-[#ECECEC] dark:border-[#232323]">
            <button
              onClick={() => {
                setActiveTab('ALL');
                setPage(0);
              }}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'ALL'
                  ? 'border-[#111111] text-[#111111] dark:border-[#FAFAFA] dark:text-[#FAFAFA]'
                  : 'border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
              }`}
            >
              All Orders
            </button>
            <button
              onClick={() => {
                setActiveTab('PENDING_VERIFICATION');
                setPage(0);
              }}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'PENDING_VERIFICATION'
                  ? 'border-[#111111] text-[#111111] dark:border-[#FAFAFA] dark:text-[#FAFAFA]'
                  : 'border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
              }`}
            >
              Pending Verification
              {pendingData && pendingData.totalElements > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {pendingData.totalElements}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Filters Bar */}
        <OrderFilters
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          onDateRangeChange={handleDateRangeChange}
          onClearFilters={handleClearFilters}
          initialOrderNumber={searchOrderNumber}
          initialStatus={selectedStatus}
          initialStartDate={startDate}
          initialEndDate={endDate}
        />

        {/* Tab Content: All Orders */}
        {activeTab === 'ALL' && (
          <div className="space-y-4">
            <OrderTable
              orders={filteredOrders}
              isLoading={isLoading}
              onViewOrder={handleViewOrder}
              onEditOrder={handleEditOrder}
              onPrintOrder={handlePrintOrder}
              onCancelOrder={handleCancelOrder}
              onVerifyOrder={handleVerifyOrder}
              userRole={user?.role}
            />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-xl text-xs">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">
                  Showing Page <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{page + 1}</span> of{' '}
                  <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{totalPages}</span> ({totalElements} total orders)
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0 || isLoading}
                    onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                    className="h-8 px-2.5 border-[#ECECEC] dark:border-[#232323]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1 || isLoading}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="h-8 px-2.5 border-[#ECECEC] dark:border-[#232323]"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Pending Verification */}
        {activeTab === 'PENDING_VERIFICATION' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Orders requiring administrator verification before fulfillment.</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="h-7 text-xs gap-1 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
            </div>

            <OrderTable
              orders={pendingData?.content || []}
              isLoading={isPendingLoading}
              onViewOrder={handleViewOrder}
              onEditOrder={handleEditOrder}
              onPrintOrder={handlePrintOrder}
              onCancelOrder={handleCancelOrder}
              onVerifyOrder={handleVerifyOrder}
              userRole={user?.role}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        onCancelOrder={handleCancelOrder}
        onVerifyOrder={handleVerifyOrder}
        onPrintOrder={handlePrintOrder}
        isCancelling={cancelOrderMutation.isPending}
        isVerifying={verifyOrderMutation.isPending}
        userRole={user?.role}
      />

      <EditOrderModal
        order={orderToEdit}
        isOpen={orderToEdit !== null}
        onClose={() => setOrderToEdit(null)}
        onSubmit={handleUpdateOrderSubmit}
        isSubmitting={updateOrderMutation.isPending}
      />

      <DispatchSheetModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
      />
    </div>
  );
};

export default OrdersPage;
