import React from 'react';
import type { InvoiceResponse } from '../invoice.types';
import { PaymentStatusBadge } from '../../../orders/components/OrderStatusBadge';
import { Button } from '../../../../components/ui/button';
import { Eye, FileText } from 'lucide-react';

interface InvoiceTableProps {
  invoices: InvoiceResponse[];
  isLoading: boolean;
  onViewInvoice: (invoice: InvoiceResponse) => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  isLoading,
  onViewInvoice,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-[#FAFAFA] dark:bg-[#151515] animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl p-12 text-center shadow-sm">
        <FileText className="w-8 h-8 text-[#71717A] dark:text-[#A1A1AA] mx-auto mb-3 opacity-60" />
        <h3 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">No invoices yet</h3>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1 max-w-sm mx-auto">
          Invoices generated after Admin order verification will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA]/50 dark:bg-[#151515]/50 text-[#71717A] dark:text-[#A1A1AA] font-medium text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Order #</th>
              <th className="py-3 px-4">Payment</th>
              <th className="py-3 px-4">Invoice Date</th>
              <th className="py-3 px-4 text-right">Total Amount</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="hover:bg-[#FAFAFA] dark:hover:bg-[#151515] transition-colors"
              >
                <td className="py-3.5 px-4 font-mono font-semibold text-[#111111] dark:text-[#FAFAFA]">
                  {invoice.invoiceNumber}
                </td>
                <td className="py-3.5 px-4 font-medium text-[#111111] dark:text-[#FAFAFA]">
                  {invoice.customerNameSnapshot}
                  {invoice.customerPhoneSnapshot && (
                    <span className="block text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-mono">
                      {invoice.customerPhoneSnapshot}
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 font-mono text-[#71717A] dark:text-[#A1A1AA]">
                  {invoice.orderNumber}
                </td>
                <td className="py-3.5 px-4">
                  <PaymentStatusBadge status={invoice.paymentStatus} />
                </td>
                <td className="py-3.5 px-4 font-mono text-[#71717A] dark:text-[#A1A1AA]">
                  {new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#111111] dark:text-[#FAFAFA]">
                  ₹{invoice.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) ?? '0.00'}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewInvoice(invoice)}
                    className="h-7 text-xs font-medium px-2.5 border-[#ECECEC] dark:border-[#232323] hover:bg-[#FAFAFA] dark:hover:bg-[#151515] gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
