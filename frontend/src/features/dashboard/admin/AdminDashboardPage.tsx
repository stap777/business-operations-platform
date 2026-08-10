import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { Sun, Moon, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button';

import {
  useDashboardSummary,
  useSalesReport,
  useDeliveryReport,
  useInventoryReport,
  useAuditLogs,
} from '../useDashboardQueries';

import { DashboardHeader } from '../components/DashboardHeader';
import { KpiGrid } from '../components/KpiGrid';
import { SalesOverview } from '../components/SalesOverview';
import { DeliveryOverview } from '../components/DeliveryOverview';
import { InventoryAlert } from '../components/InventoryAlert';
import { RecentActivity } from '../components/RecentActivity';
import { OrdersDashboardSection } from '../../orders/components/OrdersDashboardSection';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
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
    <div className="space-y-6 pb-8">
      {/* Top Header Row inside Shell */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ECECEC] dark:border-[#232323]">
        <DashboardHeader isFetching={isFetchingAny} />

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] transition-colors"
            title="Toggle Theme"
          >
            {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Button
            size="sm"
            onClick={() => navigate('/orders/create')}
            className="bg-[#111111] text-white dark:bg-[#FAFAFA] dark:text-[#111111] hover:opacity-90 text-xs font-semibold px-4 py-2 rounded-lg shadow-sm gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Order
          </Button>
        </div>
      </div>

      {/* 1. Real KPI Grid */}
      <KpiGrid
        data={summaryQuery.data}
        isLoading={summaryQuery.isLoading}
        isError={summaryQuery.isError}
      />

      {/* 2. Orders Management Section */}
      <OrdersDashboardSection title="Orders Management" showCreateButton={true} />

      {/* 3. Analytics Grid: Sales Trend + Delivery Overview */}
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

      {/* 4. Operations Grid: Low Stock Table + Recent Activity Stream */}
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
    </div>
  );
};

export default AdminDashboardPage;
