import React from 'react';
import type { InvoiceResponse } from '../invoice.types';
import type { BusinessSettingsResponse } from '../../settings/businessSettings.types';
import { getResolvedLogoUrl } from '../../../../utils/logoUtils';

interface PrintableInvoiceProps {
  invoice: InvoiceResponse;
  businessSettings?: BusinessSettingsResponse;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({
  invoice,
  businessSettings,
}) => {
  const formattedInvoiceDate = new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString(
    'en-IN',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
  );

  const businessName =
    invoice.enterpriseName || businessSettings?.businessName || 'A.S. Enterprises';
  const rawLogoUrl = businessSettings?.logoUrl || invoice.logoUrl || '/api/v1/business-settings/logo';
  const logoUrl = getResolvedLogoUrl(rawLogoUrl);
  const invoiceFooter =
    invoice.invoiceFooter || businessSettings?.invoiceFooter || 'Thank You\nVisit Again';

  const paidAmount = invoice.paidAmount ?? invoice.paymentReceivedAtGeneration ?? 0;
  const creditRemaining =
    invoice.creditRemaining ?? Math.max(0, (invoice.totalAmount ?? 0) - paidAmount);
  const paymentMethod = invoice.paymentMethod || 'Unpaid';

  return (
    <div className="printable-invoice thermal-receipt bg-white text-black font-['Courier_New',Courier,monospace] text-[11px] leading-[1.25] w-[72mm] max-w-[72mm] mx-auto p-[4mm] space-y-2 border border-neutral-300 print:border-none print:p-[4mm] print:m-0">
      {/* Business Logo (Center aligned, height limited, hides gracefully if logo absent or broken) */}
      {logoUrl && (
        <div className="text-center pt-0.5 pb-1">
          <img
            src={logoUrl}
            alt={businessName}
            className="h-10 max-h-12 w-auto object-contain mx-auto"
            onError={(e) => {
              // Hide image container completely if logo is missing or 404
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Business Name Header */}
      <div className="text-center">
        <h1 className="text-xs font-bold uppercase tracking-wide leading-tight text-black">
          {businessName}
        </h1>
      </div>

      {/* Metadata: Invoice Number & Date */}
      <div className="pt-1 text-left space-y-0.5 text-[11px] text-black">
        <p className="font-semibold">
          Invoice No: <span className="font-bold">{invoice.invoiceNumber}</span>
        </p>
        <p>Date: {formattedInvoiceDate}</p>
      </div>

      {/* Customer Information */}
      <div className="pt-0.5 text-left">
        <p className="font-semibold text-black">Customer:</p>
        <p className="font-bold text-black text-[11px] leading-snug break-words">
          {invoice.customerNameSnapshot}
        </p>
        {invoice.customerPhoneSnapshot && (
          <p className="text-[10px] text-neutral-800">Ph: {invoice.customerPhoneSnapshot}</p>
        )}
      </div>

      {/* Separator Line */}
      <div className="border-t border-dashed border-black my-1" />

      {/* Product Items (Supports Multi-line Product Wrapping & Unlimited Rows) */}
      <div className="space-y-1.5">
        {invoice.items?.map((item, idx) => (
          <div key={item.id || idx} className="text-[11px] text-black">
            <div
              className="font-semibold leading-snug text-black"
              style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
            >
              {item.productNameSnapshot}
            </div>
            <div className="flex justify-between items-center text-[10px] pt-0.5">
              <span>
                {item.quantity} × ₹{item.sellingPriceSnapshot?.toFixed(0)}
              </span>
              <span className="font-bold">₹{item.lineTotal?.toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Separator Line */}
      <div className="border-t border-dashed border-black my-1" />

      {/* Totals Section */}
      <div className="space-y-0.5 text-[11px] text-black">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{invoice.subtotal?.toFixed(0)}</span>
        </div>

        {invoice.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-₹{invoice.discountAmount?.toFixed(0)}</span>
          </div>
        )}

        <div className="flex justify-between font-bold text-xs text-black py-0.5 border-t border-b border-black">
          <span>Total</span>
          <span>₹{invoice.totalAmount?.toFixed(0)}</span>
        </div>

        <div className="flex justify-between pt-0.5">
          <span>Paid</span>
          <span>₹{paidAmount.toFixed(0)}</span>
        </div>

        <div className="flex justify-between">
          <span>Credit Remaining</span>
          <span>₹{creditRemaining.toFixed(0)}</span>
        </div>

        <div className="flex justify-between font-semibold pt-0.5">
          <span>Payment:</span>
          <span>{paymentMethod}</span>
        </div>
      </div>

      {/* Separator Line */}
      <div className="border-t border-dashed border-black my-1" />

      {/* Receipt Footer */}
      <div className="text-center text-[11px] text-black pt-1 pb-1 whitespace-pre-line leading-relaxed">
        <p className="font-semibold">{invoiceFooter}</p>
      </div>
    </div>
  );
};

export default PrintableInvoice;
