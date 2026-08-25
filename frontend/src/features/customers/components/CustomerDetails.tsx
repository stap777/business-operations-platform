import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { useCustomerDetails, useCustomerPendingOrders, useCustomerLedger } from '../hooks/useCustomers';
import { CustomerStatusBadge } from './CustomerStatusBadge';
import { Skeleton } from '../../../components/ui/skeleton';
import { Calendar, Phone, MapPin, Hash, AlertCircle, CreditCard, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CustomerDetailsProps {
  customerId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({
  customerId,
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const { data: customer, isLoading, isError, error } = useCustomerDetails(customerId);
  const {
    data: pendingOrders,
    isLoading: isPendingLoading,
    isError: isPendingError,
  } = useCustomerPendingOrders(customerId);
  const {
    data: ledger,
    isLoading: isLedgerLoading,
  } = useCustomerLedger(customerId);

  const formatCurrency = (val: number = 0) => {
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalOutstanding = pendingOrders
    ? pendingOrders.reduce((sum, item) => sum + (item.outstandingAmount || 0), 0)
    : (ledger?.outstandingBalance || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto bg-white dark:bg-[#0F0F0F] border-[#ECECEC] dark:border-[#232323] text-[#111111] dark:text-[#FAFAFA]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight flex items-center justify-between pr-6">
            <span>Customer Profile</span>
            {customer && <CustomerStatusBadge status={customer.status} />}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : isError ? (
          <div className="py-6 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-xs text-red-500 font-medium">
              {error instanceof Error ? error.message : 'Failed to fetch customer profile'}
            </p>
          </div>
        ) : customer ? (
          <div className="space-y-6 pt-2">
            {/* Identity Banner */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#141414] border border-[#ECECEC] dark:border-[#232323] flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#111111] dark:text-[#FAFAFA]">
                  {customer.fullName}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  <Hash className="w-3.5 h-3.5" />
                  <span className="font-mono font-medium text-[#111111] dark:text-[#FAFAFA]">
                    {customer.customerCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact & Location Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] space-y-1">
                <span className="text-[#71717A] dark:text-[#A1A1AA] text-[11px] flex items-center gap-1 font-medium">
                  <Phone className="w-3 h-3" /> Phone Number
                </span>
                <p className="font-medium text-[#111111] dark:text-[#FAFAFA]">
                  {customer.phoneNumber}
                </p>
                {customer.alternatePhoneNumber && (
                  <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                    Alt: {customer.alternatePhoneNumber}
                  </p>
                )}
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] space-y-1">
                <span className="text-[#71717A] dark:text-[#A1A1AA] text-[11px] flex items-center gap-1 font-medium">
                  <Calendar className="w-3 h-3" /> Registered Date
                </span>
                <p className="font-medium text-[#111111] dark:text-[#FAFAFA]">
                  {new Date(customer.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="p-3.5 rounded-lg bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] space-y-1.5 text-xs">
              <span className="text-[#71717A] dark:text-[#A1A1AA] text-[11px] flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5" /> Address
              </span>
              <p className="text-[#111111] dark:text-[#FAFAFA] leading-relaxed">
                {customer.address}
              </p>
            </div>

            {/* CREDIT / UDHAR OUTSTANDING SUMMARY CARD (Task 2) */}
            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 space-y-3 text-xs shadow-2xs">
              <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-900/40 pb-2">
                <div className="flex items-center gap-2 font-bold uppercase text-[11px] tracking-wider text-amber-900 dark:text-amber-300">
                  <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Customer Outstanding Summary (Udhar)</span>
                </div>
                {pendingOrders && pendingOrders.length > 0 && (
                  <button
                    onClick={() => {
                      onOpenChange(false);
                      navigate('/admin/payments');
                    }}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                  >
                    Manage Payments →
                  </button>
                )}
              </div>

              {isPendingLoading || isLedgerLoading ? (
                <div className="space-y-2 py-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : isPendingError ? (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Failed to load credit information.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Task 2: Outstanding Summary Grid Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#0F0F0F] border border-amber-200 dark:border-amber-900/40 shadow-2xs">
                      <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-bold uppercase block">
                        Outstanding
                      </span>
                      <p className="text-base font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                        {formatCurrency(totalOutstanding)}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#0F0F0F] border border-amber-200 dark:border-amber-900/40 shadow-2xs">
                      <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-bold uppercase block">
                        Pending Bills
                      </span>
                      <p className="text-base font-bold font-mono text-[#111111] dark:text-[#FAFAFA] mt-0.5">
                        {pendingOrders ? pendingOrders.length : 0}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#0F0F0F] border border-amber-200 dark:border-amber-900/40 shadow-2xs">
                      <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-bold uppercase block">
                        Last Payment
                      </span>
                      {(() => {
                        const paymentEntries = ledger?.entries?.filter(e => e.creditAmount > 0) || [];
                        const lastPayment = paymentEntries.length > 0 ? paymentEntries[0] : null;
                        if (lastPayment) {
                          const dt = new Date(lastPayment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                          return (
                            <p className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                              {formatCurrency(lastPayment.creditAmount)} ({dt})
                            </p>
                          );
                        }
                        return <p className="text-xs font-mono text-neutral-500 mt-0.5">None</p>;
                      })()}
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#0F0F0F] border border-amber-200 dark:border-amber-900/40 shadow-2xs">
                      <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-bold uppercase block">
                        Last Order
                      </span>
                      {(() => {
                        const orderEntries = ledger?.entries?.filter(e => e.debitAmount > 0) || [];
                        const lastOrderEntry = orderEntries.length > 0 ? orderEntries[0] : null;
                        if (lastOrderEntry) {
                          const dt = new Date(lastOrderEntry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                          return (
                            <p className="text-xs font-bold font-mono text-[#111111] dark:text-[#FAFAFA] mt-0.5">
                              {dt}
                            </p>
                          );
                        }
                        if (pendingOrders && pendingOrders.length > 0) {
                          const dt = new Date(pendingOrders[0].orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                          return (
                            <p className="text-xs font-bold font-mono text-[#111111] dark:text-[#FAFAFA] mt-0.5">
                              {dt}
                            </p>
                          );
                        }
                        return <p className="text-xs font-mono text-neutral-500 mt-0.5">None</p>;
                      })()}
                    </div>
                  </div>

                  {pendingOrders && pendingOrders.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] font-semibold text-[#71717A] dark:text-[#A1A1AA]">
                        Outstanding Orders Breakdown:
                      </p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {pendingOrders.map((order) => (
                          <div
                            key={order.orderId}
                            className="p-2.5 rounded-lg bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] flex items-center justify-between font-mono text-[11px]"
                          >
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-[#111111] dark:text-[#FAFAFA]">
                                <Receipt className="w-3 h-3 text-[#71717A]" />
                                <span>{order.orderNumber}</span>
                              </div>
                              <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
                                Total: {formatCurrency(order.totalAmount)} | Paid: {formatCurrency(order.amountPaid)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-amber-600 dark:text-amber-400">
                                {formatCurrency(order.outstandingAmount)}
                              </span>
                              <div className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold w-fit ml-auto mt-0.5">
                                {order.paymentStatus}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-3 text-center text-[11px] text-[#71717A] dark:text-[#A1A1AA] bg-white dark:bg-[#0F0F0F] rounded-lg border border-[#ECECEC] dark:border-[#232323]">
                      No active credit / udhar balance for this customer.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
