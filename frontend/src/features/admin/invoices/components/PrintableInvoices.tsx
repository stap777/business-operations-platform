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
    <div className="printable-invoices bg-white text-black print:p-0 print:m-0">
      {invoices.map((invoice, index) => {
        const isLast = index === invoices.length - 1;

        return (
          <div
            key={invoice.id || index}
            className="page-break-container break-inside-avoid print:break-inside-avoid"
            style={{
              pageBreakAfter: isLast ? 'auto' : 'always',
              breakAfter: isLast ? 'auto' : 'page',
            }}
          >
            <PrintableInvoice invoice={invoice} businessSettings={businessSettings} />
          </div>
        );
      })}
    </div>
  );
};

export default PrintableInvoices;
