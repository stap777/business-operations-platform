import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

import {
  useDashboardSummary,
  useSalesReport,
  useDeliveryReport,
  useInventoryReport,
  useAuditLogs,
} from '../features/dashboard/useDashboardQueries';

import { DashboardHeader } from '../features/dashboard/components/DashboardHeader';
import { KpiGrid } from '../features/dashboard/components/KpiGrid';
import { SalesOverview } from '../features/dashboard/components/SalesOverview';
import { DeliveryOverview } from '../features/dashboard/components/DeliveryOverview';
import { InventoryAlert } from '../features/dashboard/components/InventoryAlert';
import { RecentActivity } from '../features/dashboard/components/RecentActivity';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [salesGranularity, setSalesGranularity] = useState('DAILY');

  const isAdmin = user?.role === 'ADMIN';

  // Real backend React Query data fetching
  const summaryQuery = useDashboardSummary();
  const salesQuery = useSalesReport(salesGranularity);
  const deliveryQuery = useDeliveryReport();
  const inventoryQuery = useInventoryReport();
  const auditQuery = useAuditLogs(5, isAdmin);

  const isFetchingAny =
    summaryQuery.isFetching ||
    salesQuery.isFetching ||
    deliveryQuery.isFetching ||
    inventoryQuery.isFetching ||
    auditQuery.isFetching;

  return (
    <>
      {/* Top Header Row inside Shell */}
      <div className="flex items-center justify-between pb-2 border-b border-[#ECECEC] dark:border-[#232323]">
        <DashboardHeader isFetching={isFetchingAny} />

        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] transition-colors"
          title="Toggle Theme"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* 1. Real KPI Grid */}
      <KpiGrid
        data={summaryQuery.data}
        isLoading={summaryQuery.isLoading}
        isError={summaryQuery.isError}
      />

      {/* 2. Analytics Grid: Sales Trend + Delivery Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <SalesOverview
            data={salesQuery.data}
            granularity={salesGranularity}
            onGranularityChange={setSalesGranularity}
            isLoading={salesQuery.isLoading}
            isError={salesQuery.isError}
          />
        </div>
        <div>
          <DeliveryOverview
            data={deliveryQuery.data}
            isLoading={deliveryQuery.isLoading}
            isError={deliveryQuery.isError}
          />
        </div>
      </div>

      {/* 3. Operations Grid: Low Stock Table + Recent Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InventoryAlert
          data={inventoryQuery.data}
          isLoading={inventoryQuery.isLoading}
          isError={inventoryQuery.isError}
        />
        <RecentActivity
          data={auditQuery.data}
          isLoading={auditQuery.isLoading}
          isError={auditQuery.isError}
        />
      </div>
    </>
  );
};

export default DashboardPage;
