import React from 'react';
import { IndianRupee, ShoppingBag, CreditCard, AlertCircle, Truck, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { KpiCard } from './KpiCard';
import type { DashboardSummary } from '../dashboard.types';

interface KpiGridProps {
  data?: DashboardSummary;
  isLoading: boolean;
  isError: boolean;
}

export const KpiGrid: React.FC<KpiGridProps> = ({ data, isLoading, isError }) => {
  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-4">
      {/* Primary Financial & Order KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          title="Today's Revenue"
          value={formatCurrency(data?.todaysRevenue)}
          subtitle="Total sales generated today"
          icon={IndianRupee}
          isLoading={isLoading}
          error={isError}
        />
        <KpiCard
          title="Orders Today"
          value={data?.todaysOrders?.toLocaleString() ?? 0}
          subtitle="Orders created today"
          icon={ShoppingBag}
          isLoading={isLoading}
          error={isError}
        />
        <KpiCard
          title="Payments Received"
          value={formatCurrency(data?.todaysPaymentsReceived)}
          subtitle="Total payments collected"
          icon={CreditCard}
          isLoading={isLoading}
          error={isError}
        />
        <KpiCard
          title="Outstanding Amount"
          value={formatCurrency(data?.todaysOutstandingAmount)}
          subtitle="Uncollected balance today"
          icon={AlertCircle}
          isLoading={isLoading}
          error={isError}
        />
      </div>

      {/* Secondary Operational KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <KpiCard
          title="Deliveries Today"
          value={data?.todaysDeliveriesCompleted ?? 0}
          subtitle={`${data?.todaysDeliveriesPending ?? 0} pending`}
          icon={Truck}
          isLoading={isLoading}
          error={isError}
        />
        <KpiCard
          title="Completed Deliveries"
          value={data?.todaysDeliveriesCompleted ?? 0}
          subtitle="Successfully delivered"
          icon={CheckCircle2}
          isLoading={isLoading}
          error={isError}
        />
        <KpiCard
          title="Verified Orders"
          value={data?.todaysVerifiedOrders ?? 0}
          subtitle="Admin/Manager verified"
          icon={ShieldCheck}
          isLoading={isLoading}
          error={isError}
        />
        <KpiCard
          title="Low Stock Items"
          value={data?.lowStockProductsCount ?? 0}
          subtitle="Items below reorder level"
          icon={AlertTriangle}
          isLoading={isLoading}
          error={isError}
        />
      </div>
    </div>
  );
};
