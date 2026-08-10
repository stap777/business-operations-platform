import React, { useState } from 'react';
import type { DeliveryOrderResponse, PaymentMethod } from '../../delivery/delivery.types';
import {
  useAssignedDeliveries,
  useStartDelivery,
  useMarkDelivered,
} from '../../delivery/hooks/useDeliveries';
import { DeliveryFilters } from '../../delivery/components/DeliveryFilters';
import { DeliveryCard } from '../../delivery/components/DeliveryCard';
import { DeliveryDetailsModal } from '../../delivery/components/DeliveryDetailsModal';
import { DeliveryStatusBadge } from '../../delivery/components/DeliveryStatusBadge';
import { Button } from '../../../components/ui/button';
import { RefreshCw, Package, MapPin, Truck, CheckCircle2, Clock } from 'lucide-react';

export const DeliveryDashboardPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected Order for Details Drawer/Modal
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrderResponse | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

  // React Query Hooks
  const { data: pageData, isLoading, isError, refetch } = useAssignedDeliveries({
    page: 0,
    size: 50,
  });

  const startDeliveryMutation = useStartDelivery();
  const markDeliveredMutation = useMarkDelivered();

  const allAssignedOrders = pageData?.content || [];

  // Operational Counter summary
  const assignedCount = allAssignedOrders.filter((o) => o.orderStatus === 'ASSIGNED').length;
  const outForDeliveryCount = allAssignedOrders.filter((o) => o.orderStatus === 'OUT_FOR_DELIVERY').length;
  const deliveredCount = allAssignedOrders.filter(
    (o) => o.orderStatus === 'DELIVERED' || o.orderStatus === 'COMPLETED' || o.orderStatus === 'VERIFIED'
  ).length;

  // Frontend filter for query and tab selection
  const filteredOrders = allAssignedOrders.filter((order) => {
    // Status Tab filter
    if (statusFilter === 'ASSIGNED' && order.orderStatus !== 'ASSIGNED') return false;
    if (statusFilter === 'OUT_FOR_DELIVERY' && order.orderStatus !== 'OUT_FOR_DELIVERY') return false;
    if (
      statusFilter === 'DELIVERED' &&
      order.orderStatus !== 'DELIVERED' &&
      order.orderStatus !== 'COMPLETED' &&
      order.orderStatus !== 'VERIFIED'
    )
      return false;

    // Search Query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchNumber = order.orderNumber.toLowerCase().includes(q);
      const matchCustomer = order.customerName.toLowerCase().includes(q);
      return matchNumber || matchCustomer;
    }

    return true;
  });

  const handleCardClick = (order: DeliveryOrderResponse) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedOrder(null);
  };

  const handleStartDelivery = (orderId: number) => {
    startDeliveryMutation.mutate(orderId, {
      onSuccess: (updatedOrder) => {
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(updatedOrder);
        }
      },
    });
  };

  const handleMarkDelivered = (orderId: number, amountReceived: number, paymentMethod: PaymentMethod) => {
    markDeliveredMutation.mutate(
      {
        orderId,
        payload: { amountReceived, paymentMethod },
      },
      {
        onSuccess: () => {
          handleCloseDetails();
        },
      }
    );
  };

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ECECEC] dark:border-[#232323]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-[#FAFAFA]">
            My Deliveries
          </h1>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            View and manage your assigned deliveries.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="text-xs font-semibold h-8 gap-1.5 border-[#ECECEC] dark:border-[#232323] self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Operational Counters (Small Summary Row) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
              Assigned
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-[#111111] dark:text-[#FAFAFA] mt-1">
            {assignedCount}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
              Out for Delivery
            </span>
            <Truck className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-[#111111] dark:text-[#FAFAFA] mt-1">
            {outForDeliveryCount}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
              Delivered
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-[#111111] dark:text-[#FAFAFA] mt-1">
            {deliveredCount}
          </p>
        </div>
      </div>

      {/* Toolbar Search & Status Filters */}
      <DeliveryFilters
        onSearchChange={setSearchQuery}
        selectedStatus={statusFilter}
        onStatusChange={setStatusFilter}
        initialQuery={searchQuery}
      />

      {/* Error State */}
      {isError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-xs text-red-600 dark:text-red-400 flex items-center justify-between shadow-2xs">
          <span>Unable to load your deliveries. Please check your network connection.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs h-7 border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/50"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Deliveries Header Divider */}
      <div className="flex items-center justify-between text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] pt-1">
        <span>Today · {todayFormatted}</span>
        <span>{filteredOrders.length} {filteredOrders.length === 1 ? 'delivery' : 'deliveries'}</span>
      </div>

      {/* Content Section: Loading Skeletons vs Empty State vs Delivery List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl p-4 animate-pulse space-y-3"
            >
              <div className="h-4 bg-[#FAFAFA] dark:bg-[#151515] rounded w-1/3" />
              <div className="h-4 bg-[#FAFAFA] dark:bg-[#151515] rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl p-12 text-center shadow-2xs">
          <h3 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">
            No deliveries assigned
          </h3>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1 max-w-xs mx-auto">
            You currently have no orders assigned to you. New deliveries will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card Grid View */}
          <div className="grid grid-cols-1 md:hidden gap-3">
            {filteredOrders.map((order) => (
              <DeliveryCard key={order.id} order={order} onClick={handleCardClick} />
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA]/50 dark:bg-[#151515]/50 text-[#71717A] dark:text-[#A1A1AA] font-medium text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => handleCardClick(order)}
                      className="hover:bg-[#FAFAFA] dark:hover:bg-[#151515] transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#111111] dark:text-[#FAFAFA]">
                        {order.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#111111] dark:text-[#FAFAFA]">
                        {order.customerName}
                      </td>
                      <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA] max-w-xs truncate">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-[#71717A]" />
                          {order.deliveryAddress || 'Address on file'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA] font-mono">
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 shrink-0" />
                          {order.items?.length || 1} items
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#111111] dark:text-[#FAFAFA]">
                        ₹{order.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        <DeliveryStatusBadge status={order.orderStatus} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick(order);
                          }}
                          className="h-7 text-xs font-semibold px-3 border-[#ECECEC] dark:border-[#232323] hover:bg-[#FAFAFA] dark:hover:bg-[#151515]"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Focused Delivery Detail Drawer/Modal */}
      <DeliveryDetailsModal
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        order={selectedOrder}
        onStartDelivery={handleStartDelivery}
        onMarkDelivered={handleMarkDelivered}
        isStarting={startDeliveryMutation.isPending}
        isMarkingDelivered={markDeliveredMutation.isPending}
      />
    </div>
  );
};

export default DeliveryDashboardPage;
