import React, { useState, useRef } from 'react';
import type { InvoiceResponse } from '../invoice.types';
import type { BusinessSettingsResponse } from '../../settings/businessSettings.types';
import { PrintableInvoice } from './PrintableInvoice';
import { PaymentStatusBadge } from '../../../orders/components/OrderStatusBadge';
import { Button } from '../../../../components/ui/button';
import { X, Printer, User, FileText, ExternalLink, Receipt, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceResponse | null;
  businessSettings?: BusinessSettingsResponse;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  isOpen,
  onClose,
  invoice,
  businessSettings,
}) => {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'details'>('preview');

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* On-Screen Interactive Modal */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
        <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl max-w-3xl w-full p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#ECECEC] dark:border-[#232323]">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold font-mono text-[#111111] dark:text-[#FAFAFA]">
                  {invoice.invoiceNumber}
                </h2>
                <PaymentStatusBadge status={invoice.paymentStatus} />
              </div>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5 font-mono">
                Order #{invoice.orderNumber} · Generated on{' '}
                {new Date(invoice.invoiceDate || invoice.createdAt).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-[#FAFAFA] dark:bg-[#151515] p-1 rounded-lg border border-[#ECECEC] dark:border-[#232323] text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                    viewMode === 'preview'
                      ? 'bg-white dark:bg-[#232323] text-[#111111] dark:text-[#FAFAFA] shadow-xs'
                      : 'text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  Thermal Preview
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('details')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                    viewMode === 'details'
                      ? 'bg-white dark:bg-[#232323] text-[#111111] dark:text-[#FAFAFA] shadow-xs'
                      : 'text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Detailed View
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#151515] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content based on View Mode */}
          {viewMode === 'preview' ? (
            <div className="py-4 bg-[#F4F4F5] dark:bg-[#18181B] rounded-xl flex flex-col items-center justify-center p-4 border border-[#ECECEC] dark:border-[#27272A]">
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mb-3 font-mono text-center">
                80mm Thermal Receipt Print Output Preview
              </p>
              <div className="shadow-2xl rounded-sm overflow-hidden border border-neutral-200">
                <PrintableInvoice invoice={invoice} businessSettings={businessSettings} />
              </div>
            </div>
          ) : (
            <>
              {/* Customer & Business Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs p-3.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515]">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3" /> Customer Snapshot
                  </span>
                  <p className="font-semibold text-[#111111] dark:text-[#FAFAFA]">
                    {invoice.customerNameSnapshot}
                  </p>
                  {invoice.customerPhoneSnapshot && (
                    <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                      Phone: {invoice.customerPhoneSnapshot}
                    </p>
                  )}
                  {invoice.customerAddressSnapshot && (
                    <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                      Address: {invoice.customerAddressSnapshot}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-semibold tracking-wider flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Business & Issuer
                  </span>
                  <p className="font-semibold text-[#111111] dark:text-[#FAFAFA]">
                    {invoice.enterpriseName || businessSettings?.businessName || 'A.S. ENTERPRISES'}
                  </p>
                  <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                    Generated by: <span className="font-medium text-[#111111] dark:text-[#FAFAFA]">{invoice.generatedByName || 'Admin'}</span>
                  </p>
                  <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                    Payment Method: <span className="font-semibold">{invoice.paymentMethod || 'CASH'}</span>
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA]">Invoice Items</h3>
                <div className="border border-[#ECECEC] dark:border-[#232323] rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#FAFAFA] dark:bg-[#151515] border-b border-[#ECECEC] dark:border-[#232323] text-[#71717A] dark:text-[#A1A1AA] font-medium text-[10px] uppercase">
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
                      {invoice.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2.5 px-3 font-medium text-[#111111] dark:text-[#FAFAFA]">
                            {item.productNameSnapshot}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#71717A] dark:text-[#A1A1AA]">
                            ₹{item.sellingPriceSnapshot?.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#111111] dark:text-[#FAFAFA]">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#111111] dark:text-[#FAFAFA]">
                            ₹{item.lineTotal?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="flex flex-col items-end space-y-1.5 text-xs text-[#71717A] dark:text-[#A1A1AA] pt-2 border-t border-[#ECECEC] dark:border-[#232323]">
                <div className="flex justify-between w-56">
                  <span>Subtotal:</span>
                  <span className="font-mono text-[#111111] dark:text-[#FAFAFA]">₹{invoice.subtotal?.toFixed(2)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between w-56 text-emerald-600 dark:text-emerald-400">
                    <span>Discount:</span>
                    <span className="font-mono">-₹{invoice.discountAmount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between w-56 font-bold text-sm text-[#111111] dark:text-[#FAFAFA] pt-1.5 border-t border-[#ECECEC] dark:border-[#232323]">
                  <span>Total Amount:</span>
                  <span className="font-mono">₹{invoice.totalAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-56 text-xs text-[#71717A] dark:text-[#A1A1AA] pt-1">
                  <span>Paid Amount:</span>
                  <span className="font-mono text-[#111111] dark:text-[#FAFAFA]">
                    ₹{(invoice.paidAmount ?? invoice.paymentReceivedAtGeneration ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between w-56 text-xs font-semibold text-amber-600 dark:text-amber-400 pt-0.5">
                  <span>Credit Remaining:</span>
                  <span className="font-mono">
                    ₹{(invoice.creditRemaining ?? Math.max(0, invoice.totalAmount - (invoice.paidAmount ?? 0))).toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#ECECEC] dark:border-[#232323]">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handlePrint}
                className="bg-[#111111] text-white dark:bg-[#FAFAFA] dark:text-[#111111] hover:opacity-90 text-xs font-semibold px-4 h-8 gap-1.5 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print 80mm Receipt
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/orders')}
                className="text-xs border-[#ECECEC] dark:border-[#232323] gap-1 text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Orders
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs border-[#ECECEC] dark:border-[#232323]"
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden Container Rendered Exclusively During Window.print() */}
      <div ref={printRef} className="hidden print:block fixed inset-0 bg-white z-[9999]">
        <PrintableInvoice invoice={invoice} businessSettings={businessSettings} />
      </div>
    </>
  );
};
