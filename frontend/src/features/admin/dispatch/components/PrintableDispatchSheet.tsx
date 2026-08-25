import React from 'react';
import type { DispatchSheetResponse } from '../dispatchSheet.types';

interface PrintableDispatchSheetProps {
  dispatchSheet: DispatchSheetResponse;
  printMode?: 'A4' | 'THERMAL';
}

export const PrintableDispatchSheet: React.FC<PrintableDispatchSheetProps> = ({
  dispatchSheet,
  printMode = 'A4',
}) => {
  const formattedDate = new Date(dispatchSheet.date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const formattedPrintTime = new Date(dispatchSheet.printedAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const logoUrl = dispatchSheet.logoUrl || '/api/v1/business-settings/logo';

  const formatPaymentLabel = (method?: string) => {
    if (!method) return '[CASH]';
    const upper = method.trim().toUpperCase();
    return `[${upper}]`;
  };

  // Helper to split notes by newline or bullet and format with safe ASCII hyphen (-)
  const renderFormattedNotes = (notesText: string) => {
    const lines = notesText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    return (
      <div className="space-y-0.5">
        <span className="font-bold uppercase text-[9px] tracking-wider text-black block">
          NOTES
        </span>
        {lines.map((line, lIdx) => {
          const cleaned = line.replace(/^[•\-\*]\s*/, '');
          return (
            <p key={lIdx} className="font-mono text-black">
              - {cleaned}
            </p>
          );
        })}
      </div>
    );
  };

  // Render 80mm Thermal Receipt Continuous Roll Layout
  if (printMode === 'THERMAL') {
    return (
      <div className="thermal-dispatch-sheet printable-dispatch-sheet-thermal bg-white text-black font-mono w-[72mm] max-w-[72mm] mx-auto p-[4mm] space-y-3 text-[11px] leading-tight print:p-0 print:m-0 print:w-[72mm] print:max-w-[72mm]">
        {/* Header */}
        <div className="text-center border-b border-black pb-2 space-y-1">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={dispatchSheet.businessName}
              className="h-10 max-h-12 w-auto mx-auto object-contain mb-1"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          )}
          <h1 className="text-xs font-bold uppercase tracking-tight text-black">
            {dispatchSheet.businessName}
          </h1>
          <p className="text-[10px] font-bold uppercase border-y border-black py-0.5 my-0.5">
            DISPATCH CHECKLIST (80mm)
          </p>
          <div className="text-[10px] space-y-0.5">
            <p>Date: {formattedDate} | Total: {dispatchSheet.totalOrders}</p>
            <p>Printed: {formattedPrintTime} by {dispatchSheet.printedByName}</p>
          </div>
        </div>

        {/* Thermal Orders Stack */}
        {dispatchSheet.orders.length === 0 ? (
          <div className="text-center py-4 border border-dashed border-black text-[10px]">
            No orders scheduled for today.
          </div>
        ) : (
          <div className="space-y-3">
            {dispatchSheet.orders.map((order, idx) => {
              const sequenceNum = String(idx + 1).padStart(2, '0');
              return (
                <div
                  key={order.orderId || idx}
                  className="border-b border-black pb-2 space-y-1 text-[11px] break-inside-avoid print:break-inside-avoid"
                >
                  {/* Sequence Number, Checkbox & Customer Name */}
                  <div className="flex items-start gap-1.5">
                    <span className="font-bold text-sm font-mono min-w-[20px]">{sequenceNum}</span>
                    <div className="w-5 h-5 border-2 border-black bg-white flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs leading-tight uppercase text-black break-words">
                        {order.customerName}
                      </p>
                    </div>
                  </div>

                  {/* Task 1: Customer Location Hierarchy without Emojis */}
                  {order.customerAddress && (
                    <div className="pl-[26px] text-[10px]">
                      <span className="font-bold uppercase text-[8px] text-neutral-600 tracking-wider block">
                        ADDRESS
                      </span>
                      <p className="font-bold leading-tight text-black">
                        {order.customerAddress}
                      </p>
                    </div>
                  )}

                  {order.customerPhone && (
                    <div className="pl-[26px] text-[10px]">
                      <span className="font-bold uppercase text-[8px] text-neutral-600 tracking-wider block">
                        PHONE
                      </span>
                      <p className="font-mono text-black font-semibold">
                        {order.customerPhone}
                      </p>
                    </div>
                  )}

                  {/* Order Ref & Outlined Payment Label */}
                  <div className="flex items-center justify-between text-[10px] pl-[26px] pt-1 border-t border-dotted border-neutral-400">
                    <span className="font-mono font-bold">#{order.orderNumber}</span>
                    <span className="font-bold font-mono px-1 border border-black text-[9px] uppercase">
                      {formatPaymentLabel(order.paymentMethod)}
                    </span>
                  </div>

                  {/* Product List */}
                  <div className="pl-[26px] pt-1">
                    <table className="w-full text-[10px]">
                      <tbody>
                        {order.products?.map((prod, pIdx) => (
                          <tr key={pIdx}>
                            <td className="pr-1 align-top font-semibold">{prod.name}</td>
                            <td className="text-right font-bold font-mono whitespace-nowrap align-top">
                              x{prod.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Task 2: Notes Visibility with ASCII Hyphen */}
                  {order.notes && (
                    <div className="pl-[26px] pt-1 border-t border-neutral-200">
                      {renderFormattedNotes(order.notes)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center text-[9px] border-t border-black pt-1">
          <p>*** END OF DISPATCH ROLL ***</p>
        </div>
      </div>
    );
  }

  // Render Standard A4 Office Copy Layout
  return (
    <div className="printable-dispatch-sheet bg-white text-black font-sans w-[210mm] max-w-[210mm] mx-auto p-[10mm] space-y-4 print:p-[5mm] print:m-0 print:w-full print:max-w-none">
      {/* Document Header & Business Branding */}
      <div className="flex justify-between items-start border-b-2 border-black pb-3">
        <div className="flex items-center gap-3">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={dispatchSheet.businessName}
              className="h-12 max-h-14 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          )}
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight text-black">
              {dispatchSheet.businessName}
            </h1>
            <p className="text-sm font-semibold uppercase tracking-widest text-neutral-800">
              Today's Dispatch Checklist (A4)
            </p>
          </div>
        </div>

        {/* Audit Trail Metadata Box */}
        <div className="text-right text-xs space-y-0.5 border border-neutral-400 p-2 rounded bg-neutral-50 print:bg-white print:border-black">
          <p>
            <span className="font-bold">Date:</span> {formattedDate}
          </p>
          <p>
            <span className="font-bold">Printed At:</span> {formattedPrintTime}
          </p>
          <p>
            <span className="font-bold">Printed By:</span> {dispatchSheet.printedByName}
          </p>
          <p className="pt-0.5 font-bold text-sm">
            Total Orders: {dispatchSheet.totalOrders}
          </p>
        </div>
      </div>

      {/* Orders List Container */}
      {dispatchSheet.orders.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-neutral-300 rounded text-neutral-500 font-medium">
          No active delivery orders scheduled for {formattedDate}.
        </div>
      ) : (
        <div className="space-y-3">
          {dispatchSheet.orders.map((order, idx) => {
            const sequenceNum = String(idx + 1).padStart(2, '0');
            return (
              <div
                key={order.orderId || idx}
                className="border-2 border-black rounded p-3 space-y-2 bg-white break-inside-avoid print:break-inside-avoid"
              >
                {/* Header Row: Sequence Number, Checkbox, Customer Name (Largest) & Payment Label */}
                <div className="flex items-start justify-between border-b border-neutral-300 pb-2">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Task 1: Visible Route Sequence Number */}
                    <span className="text-lg font-bold font-mono text-black min-w-[28px]">
                      {sequenceNum}
                    </span>
                    {/* Large 24px x 24px Manual Checkbox */}
                    <div className="w-6 h-6 border-2 border-black rounded-sm bg-white flex-shrink-0 mt-0.5" />
                    
                    {/* Task 1 & 2: Customer Hierarchy - Name is largest, ADDRESS and PHONE labels uppercase without emojis */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <h2 className="text-lg font-bold text-black leading-tight uppercase">
                        {order.customerName}
                      </h2>
                      
                      {order.customerAddress && (
                        <div>
                          <span className="text-[9px] font-bold tracking-wider uppercase text-neutral-600 block">
                            ADDRESS
                          </span>
                          <p className="text-xs font-bold text-black leading-snug uppercase">
                            {order.customerAddress}
                          </p>
                        </div>
                      )}

                      {order.customerPhone && (
                        <div>
                          <span className="text-[9px] font-bold tracking-wider uppercase text-neutral-600 block">
                            PHONE
                          </span>
                          <p className="text-xs font-mono font-bold text-black">
                            {order.customerPhone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 pl-3 flex-shrink-0">
                    {/* Outlined Thermal-Friendly Payment Label */}
                    <span className="font-mono font-bold px-2 py-0.5 border-2 border-black rounded text-xs uppercase bg-white text-black">
                      {formatPaymentLabel(order.paymentMethod)}
                    </span>
                    <span className="text-xs font-mono font-bold text-neutral-700">
                      #{order.orderNumber}
                    </span>
                  </div>
                </div>

                {/* Product Items Table */}
                <div className="pt-1">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black text-neutral-700 font-bold uppercase text-[10px]">
                        <th className="py-1 px-1">Product Item</th>
                        <th className="py-1 px-1 text-right w-20">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {order.products?.map((prod, pIdx) => (
                        <tr key={pIdx}>
                          <td className="py-1 px-1 font-semibold text-black">{prod.name}</td>
                          <td className="py-1 px-1 text-right font-bold text-black font-mono">
                            {prod.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Task 2: NOTES Visibility formatted with safe ASCII hyphens */}
                {order.notes && (
                  <div className="p-2 border border-black rounded bg-neutral-50 print:bg-white text-xs">
                    {renderFormattedNotes(order.notes)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Document Footer */}
      <div className="border-t border-neutral-400 pt-2 text-center text-[10px] text-neutral-600 print:text-black">
        <p>A.S. Enterprises Operations Platform • Internal Delivery Dispatch Sheet • Driver Signature: _______________________</p>
      </div>
    </div>
  );
};

export default PrintableDispatchSheet;
