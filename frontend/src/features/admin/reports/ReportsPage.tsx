import React, { useState } from 'react';
import {
  useUnifiedReport,
  usePaymentReport,
  useInventoryReport,
  useOperatingExpenses,
} from './hooks/useReports';
import { useBusinessSettings } from '../settings/hooks/useBusinessSettings';
import { ReportFilterBar } from './components/ReportFilterBar';
import { FinancialMetricCard } from './components/FinancialMetricCard';
import { OperatingExpensesSection } from './components/OperatingExpensesSection';
import { PrintableUnifiedReport } from './components/PrintableUnifiedReport';
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  Boxes,
  Printer,
  Calendar,
  AlertTriangle,
  Loader2,
  DollarSign,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [granularity, setGranularity] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');

  // React Query Hooks
  const unifiedQuery = useUnifiedReport({ startDate, endDate, granularity });
  const paymentQuery = usePaymentReport({ startDate, endDate });
  const inventoryQuery = useInventoryReport();
  const expensesQuery = useOperatingExpenses({ startDate, endDate });
  const { data: businessSettings } = useBusinessSettings();

  const handleDateChange = (start?: string, end?: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleRefreshAll = () => {
    unifiedQuery.refetch();
    paymentQuery.refetch();
    inventoryQuery.refetch();
    expensesQuery.refetch();
  };

  const isFetchingCurrent =
    unifiedQuery.isFetching ||
    paymentQuery.isFetching ||
    inventoryQuery.isFetching ||
    expensesQuery.isFetching;

  const report = unifiedQuery.data;
  const payment = paymentQuery.data;
  const inventory = inventoryQuery.data;
  const expensesList = expensesQuery.data?.content || [];

  const isLoss = (report?.netProfit || 0) < 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Printable Component (rendered on window.print()) */}
      <PrintableUnifiedReport
        reportData={report}
        paymentData={payment}
        inventoryData={inventory}
        expenses={expensesList}
        businessSettings={businessSettings}
      />

      {/* Screen-Only Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ECECEC] dark:border-[#232323] print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#111111] dark:text-[#FAFAFA]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-[#FAFAFA]">
              Unified Business Reports
            </h1>
          </div>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            Single executive dashboard for revenue, COGS, gross profit, OPEX, net profit/loss, and operational metrics.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] text-xs font-semibold hover:opacity-90 transition-opacity self-start sm:self-auto shadow-2xs cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Report
        </button>
      </div>

      {/* Date & Period Filter Bar */}
      <div className="space-y-2 print:hidden">
        <ReportFilterBar
          onDateChange={handleDateChange}
          granularity={granularity}
          onGranularityChange={setGranularity}
          onRefresh={handleRefreshAll}
          isFetching={isFetchingCurrent}
          showGranularity={true}
        />

        {report && (
          <div className="flex items-center justify-between text-xs text-[#71717A] dark:text-[#A1A1AA] bg-[#FAFAFA] dark:bg-[#151515] px-3 py-1.5 rounded-lg border border-[#ECECEC] dark:border-[#232323]">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#111111] dark:text-[#FAFAFA]" />
              Report Period: <strong className="text-[#111111] dark:text-[#FAFAFA] font-mono">{report.startDate}</strong> → <strong className="text-[#111111] dark:text-[#FAFAFA] font-mono">{report.endDate}</strong>
            </span>
            <span className="font-mono text-[11px] uppercase bg-neutral-200 dark:bg-[#232323] px-2 py-0.5 rounded text-[#111111] dark:text-[#FAFAFA] font-bold">
              {report.granularity}
            </span>
          </div>
        )}
      </div>

      {/* Loading state */}
      {unifiedQuery.isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3 text-[#71717A]">
          <Loader2 className="w-8 h-8 animate-spin text-[#111111] dark:text-[#FAFAFA]" />
          <p className="text-xs font-medium">Generating executive financial report...</p>
        </div>
      ) : unifiedQuery.isError ? (
        <div className="p-6 rounded-xl border border-red-500/20 bg-red-50/50 dark:bg-red-950/10 text-center space-y-2 text-xs text-red-600 dark:text-red-400">
          <AlertTriangle className="w-6 h-6 mx-auto" />
          <p className="font-semibold">Failed to load unified report data.</p>
          <button
            onClick={() => unifiedQuery.refetch()}
            className="px-3 py-1 bg-red-600 text-white rounded-lg font-medium text-xs hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* COGS Incomplete Notice if applicable */}
          {report.cogsIncomplete && (
            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                Some legacy orders contain line items without recorded purchase prices. COGS and Gross Profit estimates may be partial for historical orders.
              </span>
            </div>
          )}

          {/* 1. FINANCIAL OVERVIEW (EXECUTIVE KPI CARDS) */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Financial Overview & Net Profitability
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <FinancialMetricCard
                title="Revenue"
                amount={report.totalRevenue}
                subtitle={`${report.validOrders} valid orders`}
                type="revenue"
              />
              <FinancialMetricCard
                title="COGS"
                amount={report.totalCogs}
                subtitle="Cost of goods sold"
                type="cogs"
              />
              <FinancialMetricCard
                title="Gross Profit"
                amount={report.grossProfit}
                marginPercentage={report.grossMarginPercentage}
                type="profit"
              />
              <FinancialMetricCard
                title="Operating Costs"
                amount={report.totalOperatingExpenses}
                subtitle="Total OPEX spent"
                type="opex"
              />
              <FinancialMetricCard
                title={isLoss ? 'Net Loss' : 'Net Profit'}
                amount={report.netProfit}
                marginPercentage={report.netMarginPercentage}
                type={isLoss ? 'loss' : 'profit'}
                isLoss={isLoss}
              />
            </div>
          </div>

          {/* 2. SALES & ORDERS SUMMARY */}
          <div className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-[#ECECEC] dark:border-[#232323] p-4 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-[#ECECEC] dark:border-[#232323]">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-[#111111] dark:text-[#FAFAFA]">Sales Performance Summary</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] space-y-1">
                <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-medium">Total Orders</span>
                <p className="text-lg font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">{report.totalOrders}</p>
              </div>

              <div className="p-3 rounded-lg bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] space-y-1">
                <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-medium">Completed / Delivered</span>
                <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">{report.completedOrders}</p>
              </div>

              <div className="p-3 rounded-lg bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] space-y-1">
                <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-medium">Avg Order Value</span>
                <p className="text-lg font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
                  ₹{report.averageOrderValue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] space-y-1">
                <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-medium">Total Discounts</span>
                <p className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                  ₹{report.totalDiscountGiven?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] space-y-1">
                <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-medium">Cancelled Orders</span>
                <p className="text-lg font-bold font-mono text-red-600 dark:text-red-400">{report.cancelledOrders}</p>
              </div>
            </div>
          </div>

          {/* 3. PAYMENT & COLLECTION SUMMARY */}
          {payment && (
            <div className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-[#ECECEC] dark:border-[#232323] p-4 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-[#ECECEC] dark:border-[#232323]">
                <CreditCard className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-bold text-[#111111] dark:text-[#FAFAFA]">Payment & Collection Summary</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-500/20 space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    Total Payments Received
                  </span>
                  <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    ₹{payment.totalPaymentsReceived?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
                    {payment.totalTransactions} recorded payment transactions
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-500/20 space-y-1">
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    Total Outstanding Customer Balance
                  </span>
                  <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                    ₹{payment.totalOutstandingAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
                    Unpaid & partially paid order balances
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. INVENTORY VALUATION & STOCK SUMMARY */}
          {inventory && (
            <div className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-[#ECECEC] dark:border-[#232323] p-4 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-[#ECECEC] dark:border-[#232323]">
                <Boxes className="w-4 h-4 text-purple-500" />
                <h2 className="text-sm font-bold text-[#111111] dark:text-[#FAFAFA]">Inventory Valuation & Asset Summary</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] space-y-1">
                  <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-medium">Inventory Asset Valuation</span>
                  <p className="text-base sm:text-lg font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
                    ₹{inventory.totalInventoryValuation?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] space-y-1">
                  <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-medium">Total Products / SKUs</span>
                  <p className="text-base sm:text-lg font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">{inventory.totalProducts}</p>
                </div>

                <div className="p-3 rounded-lg bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] space-y-1">
                  <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-medium">Low Stock Products</span>
                  <p className="text-base sm:text-lg font-bold font-mono text-amber-600 dark:text-amber-400">{inventory.totalLowStockCount}</p>
                </div>

                <div className="p-3 rounded-lg bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] space-y-1">
                  <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-medium">Out of Stock Products</span>
                  <p className="text-base sm:text-lg font-bold font-mono text-red-600 dark:text-red-400">{inventory.totalOutOfStockCount}</p>
                </div>
              </div>
            </div>
          )}

          {/* 5. OPERATING EXPENSES SECTION (WITH ADD/EDIT/DELETE) */}
          <OperatingExpensesSection
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      ) : null}
    </div>
  );
};

export default ReportsPage;
