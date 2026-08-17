import React from 'react';
import type { OrderResponse } from '../order.types';

interface PrintableOrderProps {
  order: OrderResponse | null;
  businessSettings?: any;
}

export const PrintableOrder: React.FC<PrintableOrderProps> = ({
  order,
  businessSettings,
}) => {
  if (!order) return null;

  const amountPaid = order.amountReceived || 0;
  const balanceDue = Math.max(0, (order.totalAmount || 0) - amountPaid);

  const getPaymentStatusText = () => {
    if (order.paymentStatus) return order.paymentStatus;
    if (amountPaid <= 0) return 'UNPAID';
    if (amountPaid >= (order.totalAmount || 0)) return 'PAID';
    return 'PARTIALLY PAID';
  };

  return (
    <div className="printable-order-container hidden print:block fixed inset-0 bg-white text-black p-8 z-[9999] font-sans text-xs overflow-y-auto">
      {/* 1. COMPANY HEADER */}
      <div className="flex justify-between items-start border-b border-black pb-4 mb-4">
        <div className="space-y-1">
          {businessSettings?.logoUrl ? (
            <img
              src={businessSettings.logoUrl}
              alt="Company Logo"
              className="h-12 w-auto object-contain mb-2"
            />
          ) : null}
          <h1 className="text-xl font-bold uppercase tracking-wide text-black">
            {businessSettings?.businessName || 'A.S. ENTERPRISES'}
          </h1>
          <p className="text-xs text-neutral-700 max-w-sm whitespace-pre-line">
            {businessSettings?.address || 'Business Address Not Configured'}
          </p>
          {businessSettings?.phone && (
            <p className="text-xs text-neutral-700">Phone: {businessSettings.phone}</p>
          )}
          {businessSettings?.email && (
            <p className="text-xs text-neutral-700">Email: {businessSettings.email}</p>
          )}
        </div>

        <div className="text-right space-y-1">
          <h2 className="text-lg font-bold uppercase tracking-wider text-black">SALES ORDER</h2>
          <p className="font-mono text-sm font-bold">#{order.orderNumber}</p>
          <p className="text-xs text-neutral-600">
            Order Date:{' '}
            <strong className="font-mono text-black">
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </strong>
          </p>
          <p className="text-xs text-neutral-600">
            Sales Rep:{' '}
            <strong className="text-black font-medium">{order.managerName || 'Unassigned'}</strong>
          </p>
        </div>
      </div>

      {/* 2. CUSTOMER & STATUS INFORMATION */}
      <div className="grid grid-cols-2 gap-4 border border-black p-3 rounded mb-4 text-xs">
        <div className="space-y-1">
          <h3 className="font-bold uppercase tracking-wider text-[10px] text-neutral-600 border-b border-neutral-300 pb-0.5">
            CUSTOMER INFORMATION
          </h3>
          <p className="font-bold text-sm">{order.customerName}</p>
          {order.customerCode && (
            <p className="font-mono text-xs text-neutral-700">Code: {order.customerCode}</p>
          )}
        </div>

        <div className="space-y-1 text-right">
          <h3 className="font-bold uppercase tracking-wider text-[10px] text-neutral-600 border-b border-neutral-300 pb-0.5">
            ORDER & FULFILLMENT STATUS
          </h3>
          <p className="text-xs">
            Order Status: <strong className="font-mono uppercase">{order.orderStatus}</strong>
          </p>
          <p className="text-xs">
            Delivery Status: <strong className="font-mono uppercase">{order.deliveryStatus}</strong>
          </p>
          {order.deliveryPersonName && (
            <p className="text-xs text-neutral-600">
              Assigned Delivery Agent: <strong className="text-black">{order.deliveryPersonName}</strong>
            </p>
          )}
        </div>
      </div>

      {/* 3. ORDER ITEMS TABLE */}
      <div className="mb-4">
        <h3 className="font-bold uppercase tracking-wider text-[10px] text-neutral-600 mb-1">
          ORDERED ITEMS
        </h3>
        <table className="w-full text-left text-xs border-collapse border border-black">
          <thead>
            <tr className="bg-neutral-100 border-b border-black font-bold uppercase text-[10px]">
              <th className="py-2 px-3 border-r border-black w-10 text-center">#</th>
              <th className="py-2 px-3 border-r border-black">Product Item</th>
              <th className="py-2 px-3 border-r border-black text-right w-20">Qty</th>
              <th className="py-2 px-3 border-r border-black text-right w-28">Unit Price</th>
              <th className="py-2 px-3 text-right w-32">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black font-mono">
            {order.items?.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="py-2 px-3 border-r border-black text-center font-sans">{idx + 1}</td>
                <td className="py-2 px-3 border-r border-black font-sans font-medium">
                  {item.productName}
                </td>
                <td className="py-2 px-3 border-r border-black text-right">
                  {item.quantity} {item.unit || ''}
                </td>
                <td className="py-2 px-3 border-r border-black text-right">
                  ₹{item.sellingPrice?.toFixed(2)}
                </td>
                <td className="py-2 px-3 text-right font-bold">
                  ₹{item.lineTotal?.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. FINANCIAL SUMMARY */}
      <div className="flex justify-between items-start gap-4 mb-6">
        <div className="w-1/2 space-y-2 text-xs">
          {(order.deliveryInstructions || order.notes) && (
            <div className="border border-neutral-300 p-2.5 rounded bg-neutral-50 space-y-1">
              {order.deliveryInstructions && (
                <p>
                  <strong>Delivery Instructions:</strong> {order.deliveryInstructions}
                </p>
              )}
              {order.notes && (
                <p>
                  <strong>Internal Notes:</strong> {order.notes}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="w-1/2">
          <table className="w-full text-xs font-mono border-collapse border border-black">
            <tbody>
              <tr>
                <td className="py-1.5 px-3 font-sans font-medium border-r border-black">Subtotal</td>
                <td className="py-1.5 px-3 text-right">₹{order.subtotal?.toFixed(2)}</td>
              </tr>
              {order.discountAmount > 0 && (
                <tr>
                  <td className="py-1.5 px-3 font-sans font-medium border-r border-black text-neutral-700">
                    Discount {order.couponCode ? `(${order.couponCode})` : ''}
                  </td>
                  <td className="py-1.5 px-3 text-right text-neutral-700">
                    -₹{order.discountAmount?.toFixed(2)}
                  </td>
                </tr>
              )}
              <tr className="bg-neutral-100 font-bold text-sm border-t border-black">
                <td className="py-2 px-3 font-sans uppercase border-r border-black">TOTAL AMOUNT</td>
                <td className="py-2 px-3 text-right">₹{order.totalAmount?.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-1.5 px-3 font-sans font-medium border-r border-black">Amount Paid</td>
                <td className="py-1.5 px-3 text-right">₹{amountPaid.toFixed(2)}</td>
              </tr>
              <tr className="font-bold bg-neutral-50 border-t border-black">
                <td className="py-1.5 px-3 font-sans uppercase border-r border-black">BALANCE DUE</td>
                <td className="py-1.5 px-3 text-right text-sm">₹{balanceDue.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-1.5 px-3 font-sans font-medium border-r border-black">Payment Status</td>
                <td className="py-1.5 px-3 text-right font-sans font-bold uppercase">
                  {getPaymentStatusText()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. FOOTER & AUTHORIZATION */}
      <div className="pt-8 border-t border-black flex justify-between items-end text-[10px] text-neutral-600">
        <div>
          <p className="font-semibold text-black">A.S. ENTERPRISES BUSINESS MANAGEMENT PLATFORM</p>
          <p>This is an official system-generated sales order document.</p>
        </div>
        <div className="text-center w-40 border-t border-black pt-1">
          <p className="font-sans font-semibold text-black">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
};
