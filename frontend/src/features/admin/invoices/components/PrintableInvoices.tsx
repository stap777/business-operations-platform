import React from 'react';
import type { InvoiceResponse } from '../invoice.types';
import type { BusinessSettingsResponse } from '../../settings/businessSettings.types';
import { PrintableInvoice } from './PrintableInvoice';

interface PrintableInvoicesProps {
  invoices: InvoiceResponse[];
  businessSettings?: BusinessSettingsResponse;
}

export const PrintableInvoices: React.FC<PrintableInvoicesProps> = ({
  invoices,
  businessSettings,
}) => {
  if (!invoices || invoices.length === 0) return null;

  return (
    <div className="printable-invoices bg-white text-black p-2">
      {/* 2-Up Grid Layout maximizing A4 printing paper utilization (2 invoices per sheet) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 print:gap-3">
        {invoices.map((invoice, index) => {
          // Trigger page break after every 2 invoices (2-Up A4 paper optimization)
          const isPageBreak = (index + 1) % 2 === 0 && index !== invoices.length - 1;

          return (
            <div
              key={invoice.id || index}
              className="page-break-container break-inside-avoid print:break-inside-avoid border border-neutral-300 print:border-black rounded p-1"
              style={{
                pageBreakAfter: isPageBreak ? 'always' : 'auto',
                breakAfter: isPageBreak ? 'page' : 'auto',
              }}
            >
              <PrintableInvoice invoice={invoice} businessSettings={businessSettings} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
