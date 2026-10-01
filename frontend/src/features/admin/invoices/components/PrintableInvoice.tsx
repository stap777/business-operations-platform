import React from 'react';
import type { InvoiceResponse } from '../invoice.types';
import type { BusinessSettingsResponse } from '../../settings/businessSettings.types';
import { numberToWords } from '../../../../utils/numberToWords';
import fssaiLogoImg from '../../../../assets/fssai_logo.png';
import upiQrCodeImg from '../../../../assets/upi_qr_code.png';
import authorisedSigImg from '../../../../assets/authorised_signature.png';

interface PrintableInvoiceProps {
  invoice: InvoiceResponse;
  businessSettings?: BusinessSettingsResponse;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({
  invoice,
  businessSettings,
}) => {
  // Format invoice date as DD/MM/YYYY
  const invoiceDateRaw = invoice.invoiceDate || invoice.createdAt;
  const dateObj = invoiceDateRaw ? new Date(invoiceDateRaw) : new Date();
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const formattedInvoiceDate = `${day}/${month}/${year}`;

  const businessName =
    invoice.enterpriseName || businessSettings?.businessName || 'A.S ENTERPRISES';
  const businessAddress =
    businessSettings?.address || invoice.enterpriseAddress || 'HNO. 3484, Zadgaon, Ratnagiri – 415612';
  const businessPhone =
    businessSettings?.phone || invoice.enterprisePhone || '9359820403 / 7397881177';
  const fssaiNumber = '21526025001185';

  const subtotal = invoice.subtotal ?? (invoice.totalAmount ?? 0) + (invoice.discountAmount ?? 0);
  const discount = invoice.discountAmount ?? 0;
  const totalAmount = invoice.totalAmount ?? 0;
  const amountInWords = numberToWords(totalAmount);

  const items = invoice.items || [];
  // Render empty rows up to min 7 rows so the table has standard retail bill book structure
  const emptyRowsCount = Math.max(1, 7 - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  return (
    <div className="printable-invoice bg-white text-black font-sans leading-normal box-border">
      {/* Outer Border wrapping the entire invoice */}
      <div className="invoice-frame border-2 border-black bg-white flex flex-col justify-between h-full">
        {/* Top Header & Meta */}
        <div>
          <div className="relative pt-1.5 pb-1 px-3 text-center">
            {/* Top Memo Title */}
            <div className="text-[10px] sm:text-[11px] font-bold text-black uppercase tracking-wider">
              Cash / Credit Memo
            </div>

            {/* Dominant Centered Business Name */}
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-black mt-0.5">
              {businessName}
            </h1>

            {/* Top-Right FSSAI Details & Logo */}
            <div className="absolute right-2.5 top-1.5 flex items-center gap-1.5">
              <div className="text-right leading-tight">
                <div className="text-[8px] sm:text-[8.5px] font-semibold text-black tracking-tight whitespace-nowrap">
                  FSSAI / Registration Number:
                </div>
                <div className="text-[11px] sm:text-[12px] font-black text-black font-mono tracking-tight">
                  {fssaiNumber}
                </div>
              </div>
              <img
                src={fssaiLogoImg}
                alt="FSSAI Logo"
                className="h-8 w-8 sm:h-9 sm:w-9 object-contain shrink-0"
              />
            </div>
          </div>

          {/* Address & Mobile Subheader */}
          <div className="border-t border-b border-black py-0.5 px-2 text-center text-[9px] sm:text-[9.5px] font-semibold text-black">
            {businessAddress}. Mobile: {businessPhone}
          </div>

          {/* Customer & Invoice Meta Details */}
          <div className="border-b border-black px-2.5 py-1 flex items-end justify-between text-xs text-black">
            <div className="flex items-end gap-1.5 flex-1 max-w-[62%]">
              <span className="font-bold text-[11px] shrink-0 text-black">Ms.</span>
              <span className="font-semibold text-[12px] text-black border-b border-black pb-0.5 px-1 truncate flex-1 font-['Segoe_Print',_'Segoe_Script',_'Caveat',_cursive,_sans-serif]">
                {invoice.customerNameSnapshot || ''}
              </span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[10.5px] text-black">No.</span>
                <span className="font-bold text-[11px] font-mono min-w-[55px] text-center text-black">
                  {invoice.invoiceNumber || '001'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[10.5px] text-black">Date :</span>
                <span className="font-semibold text-[10.5px] border-b border-black pb-0.5 px-1 min-w-[70px] text-center font-mono text-black">
                  {formattedInvoiceDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Table Container filling middle space */}
        <div className="flex-1 flex flex-col">
          <table className="w-full h-full border-collapse text-left">
            <thead>
              <tr className="border-b border-black text-black font-bold text-[10px] h-6">
                <th className="w-[34px] py-1 text-center border-r border-black uppercase">NO.</th>
                <th className="py-1 px-2 border-r border-black text-center uppercase">Product Name</th>
                <th className="w-[82px] py-1 text-center border-r border-black uppercase leading-tight">
                  Qty<br />(Crate/Pcs)
                </th>
                <th className="w-[68px] py-1 text-center border-r border-black uppercase">Rate (₹)</th>
                <th className="w-[78px] py-1 text-center uppercase">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="text-[10px] text-black">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className="border-b border-neutral-300 h-[21px]">
                  <td className="py-0.5 text-center border-r border-black font-medium">{idx + 1}</td>
                  <td className="py-0.5 px-2 border-r border-black font-medium truncate max-w-[130px]">
                    {item.productNameSnapshot}
                  </td>
                  <td className="py-0.5 text-center border-r border-black font-medium">{item.quantity}</td>
                  <td className="py-0.5 pr-2 text-right border-r border-black font-mono">
                    {item.sellingPriceSnapshot?.toFixed(2)}
                  </td>
                  <td className="py-0.5 pr-2 text-right font-mono font-medium">
                    {item.lineTotal?.toFixed(2)}
                  </td>
                </tr>
              ))}
              {emptyRows.map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-neutral-300 h-[21px]">
                  <td className="border-r border-black">&nbsp;</td>
                  <td className="border-r border-black">&nbsp;</td>
                  <td className="border-r border-black">&nbsp;</td>
                  <td className="border-r border-black">&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              ))}
              {/* Spacer row extending column borders seamlessly down to totals */}
              <tr className="h-full">
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td></td>
              </tr>
            </tbody>
            <tfoot>
              {/* Subtotal Row */}
              <tr className="border-t border-b border-black text-[10px] h-[22px]">
                <td colSpan={3} className="border-r border-black"></td>
                <td className="py-0.5 px-2 text-center font-semibold border-r border-black text-black">
                  Subtotal
                </td>
                <td className="py-0.5 pr-2 text-right font-mono font-semibold text-black">
                  ₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              {/* Discount Row */}
              <tr className="border-b border-black text-[10px] h-[22px]">
                <td colSpan={3} className="border-r border-black"></td>
                <td className="py-0.5 px-2 text-center font-semibold border-r border-black text-black">
                  Discount
                </td>
                <td className="py-0.5 pr-2 text-right font-mono font-semibold text-black">
                  ₹ {discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              {/* Total & Payment Mode Row */}
              <tr className="border-b border-black h-[24px]">
                <td
                  colSpan={3}
                  className="py-1 px-2 border-r border-black font-semibold text-[10px] text-black align-middle"
                >
                  <span>Payment Mode: </span>
                  {['Cash', 'UPI', 'Bank', 'Credit'].map((mode, i) => {
                    const isSelected = invoice.paymentMethod?.toLowerCase().includes(mode.toLowerCase());
                    return (
                      <span key={mode}>
                        {i > 0 && ' / '}
                        <span className={isSelected ? 'font-black underline' : ''}>
                          {mode}
                        </span>
                      </span>
                    );
                  })}
                </td>
                <td className="py-1 px-2 text-center font-black text-xs uppercase border-r border-black text-black">
                  Total
                </td>
                <td className="py-1 pr-2 text-right font-mono font-black text-xs text-black">
                  ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Bottom Section: Signatures & QR Code */}
        <div className="grid grid-cols-12 h-[140px] min-h-[140px] text-black">
          {/* Left Column: Amount in words & Customers Signature */}
          <div className="col-span-7 p-2.5 flex flex-col justify-between border-r border-black">
            <div>
              <div className="text-[9.5px] font-semibold text-black mb-1">
                Amount in words:
              </div>
              <div className="text-[11.5px] font-medium italic font-serif border-b border-black pb-0.5 leading-snug">
                {amountInWords}
              </div>
            </div>

            <div>
              <div className="text-[9.5px] font-bold text-black pb-0.5">
                Customers Signature
              </div>
              <div className="border-b border-black w-full" />
            </div>
          </div>

          {/* Right Column: Scan to Pay UPI QR Code & Authorised Signatory */}
          <div className="col-span-5 p-2 flex flex-col items-center justify-between text-center relative">
            <div>
              <div className="text-[8.5px] font-bold text-black tracking-tight text-center">
                Scan to pay with any UPI app
              </div>
              <div className="my-0.5 flex justify-center">
                <img
                  src={upiQrCodeImg}
                  alt="Scan to pay with any UPI app"
                  className="w-[88px] h-[88px] object-contain"
                />
              </div>
            </div>

            <div className="w-full flex flex-col items-center -mt-3">
              <div className="h-7 flex items-center justify-center">
                <img
                  src={authorisedSigImg}
                  alt="Authorised Signature"
                  className="h-7 w-auto object-contain ml-7 -mb-1"
                />
              </div>
              <div className="text-[8.5px] font-bold text-black tracking-tight">
                Authorised Signatory
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableInvoice;
