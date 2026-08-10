import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
  Sun,
  Moon,
  Plus,
  ClipboardList,
  Truck,
  CreditCard,
  ArrowRight,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { useDashboardSummary } from '../useDashboardQueries';
import { Button } from '../../../components/ui/button';
import { OrdersDashboardSection } from '../../orders/components/OrdersDashboardSection';

export const ManagerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : user?.username || 'Manager';

  // 1. Real summary metrics from backend
  const summaryQuery = useDashboardSummary();

  return (
    <div className="space-y-6 pb-8">
      {/* Top Greeting Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ECECEC] dark:border-[#232323]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-[#FAFAFA]">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            Here's what's happening today in your workspace.
          </p>
        </div>

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

      {/* 4 KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Today's Orders */}
        <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
                Today's Orders
              </span>
              <p className="text-2xl font-bold text-[#111111] dark:text-[#FAFAFA]">
                {summaryQuery.isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                ) : (
                  summaryQuery.data?.todaysOrders ?? 0
                )}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <button
            onClick={() => navigate('/orders')}
            className="text-[11px] font-semibold text-[#111111] dark:text-[#FAFAFA] hover:underline flex items-center gap-1 self-start"
          >
            View all orders <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* 2. Verified Orders */}
        <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
                Verified Orders
              </span>
              <p className="text-2xl font-bold text-[#111111] dark:text-[#FAFAFA]">
                {summaryQuery.isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                ) : (
                  summaryQuery.data?.todaysVerifiedOrders ?? 0
                )}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <button
            onClick={() => navigate('/orders')}
            className="text-[11px] font-semibold text-[#111111] dark:text-[#FAFAFA] hover:underline flex items-center gap-1 self-start"
          >
            View verified <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* 3. Awaiting Delivery */}
        <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
                Awaiting Delivery
              </span>
              <p className="text-2xl font-bold text-[#111111] dark:text-[#FAFAFA]">
                {summaryQuery.isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                ) : (
                  summaryQuery.data?.todaysDeliveriesPending ?? 0
                )}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <button
            onClick={() => navigate('/orders')}
            className="text-[11px] font-semibold text-[#111111] dark:text-[#FAFAFA] hover:underline flex items-center gap-1 self-start"
          >
            View deliveries <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* 4. Payments Collected Today */}
        <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
                Payments Received Today
              </span>
              <p className="text-2xl font-bold text-[#111111] dark:text-[#FAFAFA]">
                {summaryQuery.isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                ) : (
                  `₹${(
                    summaryQuery.data?.todaysPaymentsReceived ?? 0
                  ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <button
            onClick={() => navigate('/payments')}
            className="text-[11px] font-semibold text-[#111111] dark:text-[#FAFAFA] hover:underline flex items-center gap-1 self-start"
          >
            View payment ledger <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Orders Dashboard Section */}
      <OrdersDashboardSection title="Orders Management" showCreateButton={true} />
    </div>
  );
};

export default ManagerDashboardPage;
