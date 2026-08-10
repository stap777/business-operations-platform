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
    <div className="printable-invoices bg-white text-black">
      {invoices.map((invoice, index) => {
        const isLast = index === invoices.length - 1;

        return (
          <div
            key={invoice.id || index}
            className="w-full page-break-container"
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
