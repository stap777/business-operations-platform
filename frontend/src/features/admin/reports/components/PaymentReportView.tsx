import React from 'react';
import type { PaymentReportResponse } from '../report.types';
import { CreditCard, Wallet, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { PaymentStatusBadge } from '../../../orders/components/OrderStatusBadge';

interface PaymentReportViewProps {
  data?: PaymentReportResponse;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export const PaymentReportView: React.FC<PaymentReportViewProps> = ({
  data,
  isLoading,
  isError,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl animate-pulse p-4" />
          ))}
        </div>
        <div className="h-48 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl space-y-3">
        <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
          Unable to load payment report from server.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="text-xs gap-1.5 border-red-200 dark:border-red-800/50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  const methodSummaries = data?.methodSummaries || [];
  const recentPayments = data?.recentPayments || [];

  const formatCurrency = (val: number = 0) => {
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-1">
          <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-emerald-500" /> Payments Received
          </span>
          <p className="text-xl font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
            {formatCurrency(data?.totalPaymentsReceived)}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-1">
          <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Outstanding Balance
          </span>
          <p className="text-xl font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
            {formatCurrency(data?.totalOutstandingAmount)}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-1">
          <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-indigo-500" /> Total Transactions
          </span>
          <p className="text-xl font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
            {data?.totalTransactions ?? 0}
          </p>
        </div>
      </div>

      {/* Payment Method Breakdown Table */}
      <div className="p-5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-3">
        <h3 className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA]">
          Collection Breakdown by Payment Method
        </h3>

        {methodSummaries.length === 0 ? (
          <p className="text-xs text-[#71717A] text-center py-4">No payment transactions recorded for this period.</p>
        ) : (
          <div className="overflow-x-auto border border-[#ECECEC] dark:border-[#232323] rounded-lg">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAFAFA] dark:bg-[#151515] border-b border-[#ECECEC] dark:border-[#232323] text-[#71717A] dark:text-[#A1A1AA] font-medium text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Payment Method</th>
                  <th className="py-2.5 px-3 text-right">Transactions</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
                {methodSummaries.map((method, idx) => (
                  <tr key={idx} className="hover:bg-[#FAFAFA] dark:hover:bg-[#151515]">
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#111111] dark:text-[#FAFAFA] uppercase">
                      {method.paymentMethod}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#111111] dark:text-[#FAFAFA]">
                      {method.transactionCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#111111] dark:text-[#FAFAFA]">
                      {formatCurrency(method.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Payments Section */}
      {recentPayments.length > 0 && (
        <div className="p-5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-3">
          <h3 className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA]">
            Recent Payment Transactions
          </h3>
          <div className="overflow-x-auto border border-[#ECECEC] dark:border-[#232323] rounded-lg">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAFAFA] dark:bg-[#151515] border-b border-[#ECECEC] dark:border-[#232323] text-[#71717A] dark:text-[#A1A1AA] font-medium text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Received At</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
                {recentPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#151515]">
                    <td className="py-2.5 px-3 font-mono text-[#111111] dark:text-[#FAFAFA]">
                      {payment.orderNumber}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#111111] dark:text-[#FAFAFA]">
                      {payment.customerName}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#71717A] dark:text-[#A1A1AA] uppercase">
                      {payment.paymentMethod}
                    </td>
                    <td className="py-2.5 px-3">
                      <PaymentStatusBadge status={payment.paymentStatus as any} />
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#71717A] dark:text-[#A1A1AA]">
                      {new Date(payment.receivedAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#111111] dark:text-[#FAFAFA]">
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
