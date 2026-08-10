import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { OrderResponse, OrderStatus } from './order.types';
import { useOrders, useCancelOrder, useVerifyOrder } from './hooks/useOrders';
import { useAuth } from '../../context/AuthContext';
import { OrderFilters } from './components/OrderFilters';
import { OrderTable } from './components/OrderTable';
import { OrderDetailsModal } from './components/OrderDetailsModal';
import { Button } from '../../components/ui/button';
import { Plus, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchOrderNumber, setSearchOrderNumber] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | undefined>(undefined);
  const [page, setPage] = useState<number>(0);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

  // React Query Hooks
  const {
    data: ordersData,
    isLoading,
    isError,
    refetch,
  } = useOrders({
    orderNumber: searchOrderNumber,
    status: selectedStatus,
    page,
    size: 20,
  });

  const cancelOrderMutation = useCancelOrder();
  const verifyOrderMutation = useVerifyOrder();

  const handleSearchChange = (query: string) => {
    setSearchOrderNumber(query);
    setPage(0);
  };

  const handleStatusChange = (status?: OrderStatus) => {
    setSelectedStatus(status);
    setPage(0);
  };

  const handleViewOrder = (order: OrderResponse) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
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

  const orders = ordersData?.content || [];
  const totalPages = ordersData?.totalPages || 0;
  const totalElements = ordersData?.totalElements || 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header Bar (Aven Design System) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ECECEC] dark:border-[#232323]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-[#FAFAFA]">
            Orders
          </h1>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            Track and manage business orders.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => navigate('/orders/create')}
          className="bg-[#111111] text-white dark:bg-[#FAFAFA] dark:text-[#111111] hover:opacity-90 text-xs font-semibold px-4 py-2 rounded-lg shadow-sm gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Order
        </Button>
      </div>

      {/* Main View Container */}
      <div className="space-y-4">
        {/* Toolbar Filters */}
        <OrderFilters
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          initialOrderNumber={searchOrderNumber}
          initialStatus={selectedStatus}
        />

        {/* Error State */}
        {isError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
            <span>Unable to load orders from server. Please check your connection or retry.</span>
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
        <OrderTable
          orders={orders}
          isLoading={isLoading}
          onViewOrder={handleViewOrder}
          onCancelOrder={handleCancelOrder}
          onVerifyOrder={handleVerifyOrder}
          userRole={user?.role}
        />

        {/* Pagination Controls */}
        {ordersData && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-[#71717A] dark:text-[#A1A1AA]">
            <div>
              Showing page <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{ordersData.number + 1}</span> of{' '}
              <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{totalPages}</span> ({totalElements} records)
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={ordersData.first || isLoading}
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                className="h-8 text-xs font-medium gap-1 border-[#ECECEC] dark:border-[#232323]"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={ordersData.last || isLoading}
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

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        order={selectedOrder}
        onCancelOrder={handleCancelOrder}
        onVerifyOrder={handleVerifyOrder}
        isCancelling={cancelOrderMutation.isPending}
        isVerifying={verifyOrderMutation.isPending}
        userRole={user?.role}
      />
    </div>
  );
};

export default OrdersPage;
