import React from 'react';
import type { DispatchSheetResponse } from '../dispatchSheet.types';
import { getResolvedLogoUrl } from '../../../../utils/logoUtils';

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

  const rawLogoUrl = dispatchSheet.logoUrl || '/api/v1/business-settings/logo';
  const logoUrl = getResolvedLogoUrl(rawLogoUrl);

  const formatPaymentLabel = (method?: string) => {
    if (!method) return '[CASH]';
    const upper = method.trim().toUpperCase();
    return `[${upper}]`;
  };

  // Helper to format unit with proper singular/plural labeling
  const formatUnit = (unit?: string, qty: number = 1): string => {
    if (!unit) return qty === 1 ? 'BOX' : 'BOXES';
    const u = unit.toUpperCase().trim();
    if (u === 'BOX') return qty === 1 ? 'BOX' : 'BOXES';
    if (u === 'BOTTLE') return qty === 1 ? 'BOTTLE' : 'BOTTLES';
    if (u === 'BARREL') return qty === 1 ? 'BARREL' : 'BARRELS';
    if (u === 'PCS' || u === 'PIECE' || u === 'PIECES') return 'PCS';
    return qty === 1 ? u : `${u}S`;
  };

  // Aggregate loading summary by product ID and unit across all active orders
  const loadingSummary = React.useMemo(() => {
    const summaryMap = new Map<string, { productId?: number; name: string; quantity: number; unit: string }>();

    for (const order of dispatchSheet.orders || []) {
      if (order.orderStatus === 'VOIDED' || order.orderStatus === 'CANCELLED') {
        continue;
      }
      for (const prod of order.products || []) {
        const prodIdKey = prod.productId !== undefined && prod.productId !== null ? `id_${prod.productId}` : `name_${prod.name}`;
        const unitKey = (prod.unit || 'BOX').toUpperCase().trim();
        const groupKey = `${prodIdKey}__${unitKey}`;

        const existing = summaryMap.get(groupKey);
        if (existing) {
          existing.quantity += prod.quantity;
        } else {
          summaryMap.set(groupKey, {
            productId: prod.productId,
            name: prod.name,
            quantity: prod.quantity,
            unit: prod.unit || 'BOX',
          });
        }
      }
    }

    return Array.from(summaryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [dispatchSheet.orders]);

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
      <div className="thermal-dispatch-sheet printable-dispatch-sheet-thermal bg-white text-black font-mono w-[72mm] max-w-[72mm] mx-auto p-[4mm] space-y-2.5 text-[11px] leading-tight print:p-0 print:m-0 print:w-[72mm] print:max-w-[72mm]">
        {/* Header */}
        <div className="text-center border-b border-black pb-1.5 space-y-0.5">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={dispatchSheet.businessName}
              className="h-8 max-h-10 w-auto mx-auto object-contain mb-1"
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
          <div className="text-[9.5px] space-y-0.5">
            <p>Date: {formattedDate} | Total: {dispatchSheet.totalOrders}</p>
            <p>Printed: {formattedPrintTime} by {dispatchSheet.printedByName}</p>
          </div>
        </div>

        {/* Thermal Loading Summary */}
        {loadingSummary.length > 0 && (
          <div className="border-b border-black pb-1.5 mb-1.5 space-y-1 text-[10px] break-inside-avoid print:break-inside-avoid">
            <p className="font-bold uppercase tracking-wider text-[9px] border-b border-dotted border-black pb-0.5">
              LOADING SUMMARY:
            </p>
            <div className="space-y-0.5">
              {loadingSummary.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center font-mono">
                  <span className="truncate pr-1">{item.name}</span>
                  <span className="font-bold whitespace-nowrap">
                    {item.quantity} {formatUnit(item.unit, item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Thermal Orders Stack */}
        {dispatchSheet.orders.length === 0 ? (
          <div className="text-center py-4 border border-dashed border-black text-[10px]">
            No orders scheduled for today.
          </div>
        ) : (
          <div className="space-y-2">
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
                    <div className="w-4.5 h-4.5 border-2 border-black bg-white flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs leading-tight uppercase text-black break-words">
                        {order.customerName}
                      </p>
                    </div>
                  </div>

                  {/* Customer Location Hierarchy */}
                  {order.customerAddress && (
                    <div className="pl-[24px] text-[10px]">
                      <span className="font-bold uppercase text-[8px] text-neutral-600 tracking-wider">
                        ADDR:{' '}
                      </span>
                      <span className="font-bold leading-tight text-black">
                        {order.customerAddress}
                      </span>
                    </div>
                  )}

                  {order.customerPhone && (
                    <div className="pl-[24px] text-[10px]">
                      <span className="font-bold uppercase text-[8px] text-neutral-600 tracking-wider">
                        TEL:{' '}
                      </span>
                      <span className="font-mono text-black font-semibold">
                        {order.customerPhone}
                      </span>
                    </div>
                  )}

                  {/* Order Ref & Outlined Payment Label */}
                  <div className="flex items-center justify-between text-[10px] pl-[24px] pt-0.5 border-t border-dotted border-neutral-400">
                    <span className="font-mono font-bold">#{order.orderNumber}</span>
                    <div className="text-right space-x-1">
                      <span className="font-bold font-mono px-1 border border-black text-[9px] uppercase">
                        {formatPaymentLabel(order.paymentMethod)}
                      </span>
                      {order.balanceDue !== undefined && (
                        <span className="font-bold font-mono text-[10px] text-black">
                          COLLECT: ₹{order.balanceDue.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product List */}
                  <div className="pl-[24px] pt-0.5">
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

                  {/* Notes Visibility with ASCII Hyphen */}
                  {order.notes && (
                    <div className="pl-[24px] pt-0.5 border-t border-neutral-200">
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

  // Render Compact Standard A4 Office Copy Layout
  return (
    <div className="printable-dispatch-sheet bg-white text-black font-sans w-full max-w-[210mm] mx-auto p-[6mm] space-y-2.5 print:p-0 print:m-0 print:w-full print:max-w-none">
      {/* Document Header & Business Branding */}
      <div className="flex justify-between items-center border-b-2 border-black pb-2">
        <div className="flex items-center gap-2.5">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={dispatchSheet.businessName}
              className="h-9 max-h-10 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          )}
          <div>
            <h1 className="text-lg font-bold uppercase tracking-tight text-black">
              {dispatchSheet.businessName}
            </h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
              Today's Dispatch Checklist (A4)
            </p>
          </div>
        </div>

        {/* Audit Trail Metadata Box */}
        <div className="text-right text-[11px] leading-tight border border-black p-1.5 px-2.5 rounded bg-neutral-50 print:bg-white space-y-0.5">
          <p>
            <span className="font-bold">Date:</span> {formattedDate} &bull;{' '}
            <span className="font-bold">Printed:</span> {formattedPrintTime}
          </p>
          <p>
            <span className="font-bold">By:</span> {dispatchSheet.printedByName} &bull;{' '}
            <span className="font-bold">Total Orders:</span> {dispatchSheet.totalOrders}
          </p>
        </div>
      </div>

      {/* Loading Summary Box */}
      {loadingSummary.length > 0 && (
        <div className="border border-black rounded p-2 bg-neutral-50 print:bg-white text-xs break-inside-avoid print:break-inside-avoid">
          <div className="font-bold text-[10.5px] uppercase tracking-wider text-neutral-800 border-b border-neutral-300 pb-1 mb-1.5 flex justify-between items-center">
            <span>LOADING SUMMARY (TOTAL GOODS TO LOAD)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-1 font-mono text-[11px]">
            {loadingSummary.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-dotted border-neutral-300 py-0.5">
                <span className="font-sans font-semibold text-black truncate pr-1">{item.name}</span>
                <span className="font-bold text-black whitespace-nowrap">
                  {item.quantity} {formatUnit(item.unit, item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders List Container */}
      {dispatchSheet.orders.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-neutral-300 rounded text-neutral-500 font-medium">
          No active delivery orders scheduled for {formattedDate}.
        </div>
      ) : (
        <div className="space-y-2">
          {dispatchSheet.orders.map((order, idx) => {
            const sequenceNum = String(idx + 1).padStart(2, '0');
            const toCollect = (order.balanceDue ?? order.totalAmount ?? 0).toFixed(0);

            return (
              <div
                key={order.orderId || idx}
                className="border border-black rounded p-2 space-y-1.5 bg-white break-inside-avoid print:break-inside-avoid"
              >
                {/* Header Row: Sequence Number, Checkbox, Customer Details & Payment/Totals */}
                <div className="flex items-start justify-between border-b border-neutral-300 pb-1.5">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    {/* Route Sequence Number */}
                    <span className="text-base font-bold font-mono text-black min-w-[24px]">
                      {sequenceNum}
                    </span>
                    {/* 20px x 20px Manual Checkbox */}
                    <div className="w-5 h-5 border-2 border-black rounded-sm bg-white flex-shrink-0 mt-0.5" />

                    {/* Customer Info Hierarchy */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h2 className="text-sm font-bold text-black leading-snug uppercase truncate">
                        {order.customerName}
                      </h2>

                      {order.customerAddress && (
                        <p className="text-xs text-black leading-tight">
                          <span className="text-[9px] font-bold uppercase text-neutral-600 tracking-wider">
                            ADDR:{' '}
                          </span>
                          <span className="font-semibold uppercase">{order.customerAddress}</span>
                        </p>
                      )}

                      {order.customerPhone && (
                        <p className="text-xs text-black leading-tight">
                          <span className="text-[9px] font-bold uppercase text-neutral-600 tracking-wider">
                            TEL:{' '}
                          </span>
                          <span className="font-mono font-bold">{order.customerPhone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Payment Info & Totals */}
                  <div className="flex flex-col items-end gap-1 pl-2 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold px-1.5 py-0.5 border border-black rounded text-[10px] uppercase bg-white text-black">
                        {formatPaymentLabel(order.paymentMethod)}
                      </span>
                      <span className="text-xs font-mono font-bold text-neutral-700">
                        #{order.orderNumber}
                      </span>
                    </div>

                    {order.totalAmount !== undefined && (
                      <div className="text-right border border-black px-2 py-0.5 rounded bg-neutral-50 print:bg-white text-xs font-mono leading-tight">
                        <span className="text-[10px] text-neutral-600 font-medium">
                          Total: ₹{order.totalAmount.toFixed(0)}
                        </span>
                        <span className="mx-1 text-neutral-400">|</span>
                        <span className="text-xs font-bold text-black">
                          COLLECT: ₹{toCollect}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Items Table */}
                <div className="pt-0.5">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black text-neutral-700 font-bold uppercase text-[9.5px]">
                        <th className="py-0.5 px-1">Product Item</th>
                        <th className="py-0.5 px-1 text-right w-20">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {order.products?.map((prod, pIdx) => (
                        <tr key={pIdx}>
                          <td className="py-0.5 px-1 font-semibold text-black">{prod.name}</td>
                          <td className="py-0.5 px-1 text-right font-bold text-black font-mono">
                            {prod.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* NOTES Formatted with Safe ASCII Hyphens */}
                {order.notes && (
                  <div className="p-1 px-2 border border-black rounded bg-neutral-50 print:bg-white text-[11px] leading-tight">
                    {renderFormattedNotes(order.notes)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Document Footer */}
      <div className="border-t border-neutral-400 pt-1.5 text-center text-[10px] text-neutral-600 print:text-black">
        <p>
          {dispatchSheet.businessName || 'A.S ENTERPRISES'} &bull; Internal Delivery Dispatch Sheet &bull; Driver Signature: _______________________
        </p>
      </div>
    </div>
  );
};

export default PrintableDispatchSheet;
