import React from 'react';
import type { UnifiedReportResponse, PaymentReportResponse, InventoryReportResponse, OperatingExpenseResponse } from '../report.types';
import { PrintableReportLayout } from '../../../../components/print/PrintableReportLayout';

interface PrintableUnifiedReportProps {
  reportData?: UnifiedReportResponse;
  paymentData?: PaymentReportResponse;
  inventoryData?: InventoryReportResponse;
  expenses?: OperatingExpenseResponse[];
  businessSettings?: any;
}

export const PrintableUnifiedReport: React.FC<PrintableUnifiedReportProps> = ({
  reportData,
  paymentData,
  inventoryData,
  expenses = [],
  businessSettings,
}) => {
  if (!reportData) return null;

  const isLoss = (reportData.netProfit || 0) < 0;

  return (
    <PrintableReportLayout
      title="EXECUTIVE FINANCIAL & OPERATIONAL REPORT"
      subtitle={`Period: ${reportData.startDate} to ${reportData.endDate} (${reportData.granularity})`}
      startDate={reportData.startDate}
      endDate={reportData.endDate}
      logoUrl={businessSettings?.logoUrl}
      businessName={businessSettings?.businessName}
      businessPhone={businessSettings?.phone}
      businessAddress={businessSettings?.address}
    >
      {/* 1. FINANCIAL OVERVIEW */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-1">
          1. FINANCIAL OVERVIEW
        </h3>
        <table className="w-full text-left text-xs border-collapse border border-black">
          <thead>
            <tr className="bg-neutral-100 border-b border-black font-bold uppercase text-[10px]">
              <th className="py-2 px-3 border-r border-black">Metric</th>
              <th className="py-2 px-3 border-r border-black text-right">Amount (₹)</th>
              <th className="py-2 px-3 text-right">Margin / Ratio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black font-mono">
            <tr>
              <td className="py-2 px-3 border-r border-black font-sans font-medium">Gross Revenue</td>
              <td className="py-2 px-3 border-r border-black text-right font-bold">
                ₹{reportData.totalRevenue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-3 text-right text-neutral-600">100.0%</td>
            </tr>
            <tr>
              <td className="py-2 px-3 border-r border-black font-sans font-medium">Cost of Goods Sold (COGS)</td>
              <td className="py-2 px-3 border-r border-black text-right">
                ₹{reportData.totalCogs?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-3 text-right text-neutral-600">-</td>
            </tr>
            <tr className="bg-neutral-50 font-bold">
              <td className="py-2 px-3 border-r border-black font-sans">Gross Profit</td>
              <td className="py-2 px-3 border-r border-black text-right">
                ₹{reportData.grossProfit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-3 text-right">
                {reportData.grossMarginPercentage?.toFixed(1)}%
              </td>
            </tr>
            <tr>
              <td className="py-2 px-3 border-r border-black font-sans font-medium">Operating Expenses (OPEX)</td>
              <td className="py-2 px-3 border-r border-black text-right">
                ₹{reportData.totalOperatingExpenses?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-3 text-right text-neutral-600">-</td>
            </tr>
            <tr className={`font-black ${isLoss ? 'bg-red-50 text-red-900' : 'bg-neutral-200 text-black'}`}>
              <td className="py-2.5 px-3 border-r border-black font-sans uppercase">
                NET {isLoss ? 'LOSS' : 'PROFIT'}
              </td>
              <td className="py-2.5 px-3 border-r border-black text-right text-sm">
                ₹{reportData.netProfit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2.5 px-3 text-right text-sm">
                {reportData.netMarginPercentage?.toFixed(1)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 2. SALES & ORDERS SUMMARY */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-1">
          2. SALES & ORDERS SUMMARY
        </h3>
        <div className="grid grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-2.5 border border-black rounded text-center">
            <span className="block font-sans text-[10px] text-neutral-600 uppercase">Total Orders</span>
            <span className="font-bold text-sm">{reportData.totalOrders}</span>
          </div>
          <div className="p-2.5 border border-black rounded text-center">
            <span className="block font-sans text-[10px] text-neutral-600 uppercase">Avg Order Value</span>
            <span className="font-bold text-sm">₹{reportData.averageOrderValue?.toFixed(2)}</span>
          </div>
          <div className="p-2.5 border border-black rounded text-center">
            <span className="block font-sans text-[10px] text-neutral-600 uppercase">Discounts Given</span>
            <span className="font-bold text-sm">₹{reportData.totalDiscountGiven?.toFixed(2)}</span>
          </div>
          <div className="p-2.5 border border-black rounded text-center">
            <span className="block font-sans text-[10px] text-neutral-600 uppercase">Cancelled Orders</span>
            <span className="font-bold text-sm">{reportData.cancelledOrders}</span>
          </div>
        </div>
      </div>

      {/* 3. PAYMENT & COLLECTION SUMMARY */}
      {paymentData && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-1">
            3. PAYMENT & COLLECTION SUMMARY
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2.5 border border-black rounded">
              <span className="block font-sans text-[10px] text-neutral-600 uppercase">Total Payments Received</span>
              <span className="font-bold text-sm">₹{paymentData.totalPaymentsReceived?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="p-2.5 border border-black rounded">
              <span className="block font-sans text-[10px] text-neutral-600 uppercase">Total Outstanding Balance</span>
              <span className="font-bold text-sm">₹{paymentData.totalOutstandingAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. INVENTORY VALUATION SUMMARY */}
      {inventoryData && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-1">
            4. INVENTORY VALUATION & STOCK SUMMARY
          </h3>
          <div className="grid grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 border border-black rounded text-center">
              <span className="block font-sans text-[10px] text-neutral-600 uppercase">Inventory Valuation</span>
              <span className="font-bold text-sm">₹{inventoryData.totalInventoryValuation?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="p-2.5 border border-black rounded text-center">
              <span className="block font-sans text-[10px] text-neutral-600 uppercase">Total SKUs</span>
              <span className="font-bold text-sm">{inventoryData.totalProducts}</span>
            </div>
            <div className="p-2.5 border border-black rounded text-center">
              <span className="block font-sans text-[10px] text-neutral-600 uppercase">Low Stock SKUs</span>
              <span className="font-bold text-sm">{inventoryData.totalLowStockCount}</span>
            </div>
            <div className="p-2.5 border border-black rounded text-center">
              <span className="block font-sans text-[10px] text-neutral-600 uppercase">Out of Stock SKUs</span>
              <span className="font-bold text-sm">{inventoryData.totalOutOfStockCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. OPERATING EXPENSES TABLE */}
      {expenses.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-1">
            5. ITEMISED OPERATING EXPENSES
          </h3>
          <table className="w-full text-left text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-neutral-100 border-b border-black font-bold uppercase text-[10px]">
                <th className="py-2 px-3 border-r border-black">Date</th>
                <th className="py-2 px-3 border-r border-black">Category</th>
                <th className="py-2 px-3 border-r border-black">Description</th>
                <th className="py-2 px-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black font-mono">
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="py-1.5 px-3 border-r border-black">{expense.expenseDate}</td>
                  <td className="py-1.5 px-3 border-r border-black font-sans uppercase text-[10px] font-bold">
                    {expense.category}
                  </td>
                  <td className="py-1.5 px-3 border-r border-black font-sans">{expense.description}</td>
                  <td className="py-1.5 px-3 text-right font-bold">
                    ₹{expense.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              <tr className="bg-neutral-100 font-bold border-t border-black">
                <td colSpan={3} className="py-2 px-3 border-r border-black font-sans uppercase text-right">
                  Total Operating Expenses
                </td>
                <td className="py-2 px-3 text-right text-sm">
                  ₹{reportData.totalOperatingExpenses?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </PrintableReportLayout>
  );
};
