import React, { useState } from 'react';
import {
  useSalesReport,
  usePaymentReport,
  useInventoryReport,
  useDeliveryReport,
} from './hooks/useReports';
import { ReportFilterBar } from './components/ReportFilterBar';
import { SalesReportView } from './components/SalesReportView';
import { PaymentReportView } from './components/PaymentReportView';
import { InventoryReportView } from './components/InventoryReportView';
import { DeliveryReportView } from './components/DeliveryReportView';
import { AuditLogsReportView } from './components/AuditLogsReportView';
import { BarChart3, TrendingUp, CreditCard, Boxes, Truck, ShieldCheck, Layers } from 'lucide-react';

export type ReportTab = 'OVERVIEW' | 'SALES' | 'PAYMENTS' | 'INVENTORY' | 'DELIVERY' | 'AUDIT';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('OVERVIEW');
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [granularity, setGranularity] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');

  // React Query Hooks (Each tab handles loading/error independently)
  const salesQuery = useSalesReport({ startDate, endDate, granularity });
  const paymentQuery = usePaymentReport({ startDate, endDate });
  const inventoryQuery = useInventoryReport();
  const deliveryQuery = useDeliveryReport({ startDate, endDate });

  const handleDateChange = (start?: string, end?: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleRefreshAll = () => {
    if (activeTab === 'OVERVIEW' || activeTab === 'SALES') salesQuery.refetch();
    if (activeTab === 'OVERVIEW' || activeTab === 'PAYMENTS') paymentQuery.refetch();
    if (activeTab === 'OVERVIEW' || activeTab === 'INVENTORY') inventoryQuery.refetch();
    if (activeTab === 'OVERVIEW' || activeTab === 'DELIVERY') deliveryQuery.refetch();
  };

  const isFetchingCurrent =
    salesQuery.isFetching ||
    paymentQuery.isFetching ||
    inventoryQuery.isFetching ||
    deliveryQuery.isFetching;

  return (
    <div className="space-y-6 pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ECECEC] dark:border-[#232323]">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#111111] dark:text-[#FAFAFA]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-[#FAFAFA]">
              Business Reports
            </h1>
          </div>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            Operational analytics, sales performance, collection metrics, and audit logs.
          </p>
        </div>
      </div>

      {/* Tabs Navigation Header */}
      <div className="flex items-center gap-1 border-b border-[#ECECEC] dark:border-[#232323] overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'Overview', icon: Layers },
          { id: 'SALES', label: 'Sales', icon: TrendingUp },
          { id: 'PAYMENTS', label: 'Payments', icon: CreditCard },
          { id: 'INVENTORY', label: 'Inventory', icon: Boxes },
          { id: 'DELIVERY', label: 'Delivery', icon: Truck },
          { id: 'AUDIT', label: 'Audit Logs', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors shrink-0 ${
                isActive
                  ? 'border-[#111111] text-[#111111] dark:border-[#FAFAFA] dark:text-[#FAFAFA]'
                  : 'border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Shared Filter Bar (Active for Sales, Payments, Delivery, and Overview) */}
      {(activeTab === 'OVERVIEW' || activeTab === 'SALES' || activeTab === 'PAYMENTS' || activeTab === 'DELIVERY') && (
        <ReportFilterBar
          onDateChange={handleDateChange}
          granularity={granularity}
          onGranularityChange={setGranularity}
          onRefresh={handleRefreshAll}
          isFetching={isFetchingCurrent}
          showGranularity={activeTab === 'SALES' || activeTab === 'OVERVIEW'}
        />
      )}

      {/* Tab Content Renderers */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Sales Performance
            </h2>
            <SalesReportView
              data={salesQuery.data}
              isLoading={salesQuery.isLoading}
              isError={salesQuery.isError}
              onRetry={() => salesQuery.refetch()}
            />
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" /> Collection & Payments
            </h2>
            <PaymentReportView
              data={paymentQuery.data}
              isLoading={paymentQuery.isLoading}
              isError={paymentQuery.isError}
              onRetry={() => paymentQuery.refetch()}
            />
          </div>
        </div>
      )}

      {activeTab === 'SALES' && (
        <SalesReportView
          data={salesQuery.data}
          isLoading={salesQuery.isLoading}
          isError={salesQuery.isError}
          onRetry={() => salesQuery.refetch()}
        />
      )}

      {activeTab === 'PAYMENTS' && (
        <PaymentReportView
          data={paymentQuery.data}
          isLoading={paymentQuery.isLoading}
          isError={paymentQuery.isError}
          onRetry={() => paymentQuery.refetch()}
        />
      )}

      {activeTab === 'INVENTORY' && (
        <InventoryReportView
          data={inventoryQuery.data}
          isLoading={inventoryQuery.isLoading}
          isError={inventoryQuery.isError}
          onRetry={() => inventoryQuery.refetch()}
        />
      )}

      {activeTab === 'DELIVERY' && (
        <DeliveryReportView
          data={deliveryQuery.data}
          isLoading={deliveryQuery.isLoading}
          isError={deliveryQuery.isError}
          onRetry={() => deliveryQuery.refetch()}
        />
      )}

      {activeTab === 'AUDIT' && <AuditLogsReportView />}
    </div>
  );
};

export default ReportsPage;
