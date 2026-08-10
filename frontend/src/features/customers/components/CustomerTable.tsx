import React from 'react';
import type { CustomerResponse } from '../customer.types';
import { CustomerStatusBadge } from './CustomerStatusBadge';
import { Button } from '../../../components/ui/button';
import { Eye, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';

interface CustomerTableProps {
  customers: CustomerResponse[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onViewCustomer: (id: number) => void;
  onAddCustomerClick: () => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onViewCustomer,
  onAddCustomerClick,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-48 flex-1" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">
            Failed to Load Customers
          </h3>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1 max-w-sm mx-auto">
            {errorMessage || 'Unable to communicate with Spring Boot customer APIs.'}
          </p>
        </div>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="text-xs font-medium gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Connection
          </Button>
        )}
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-[#1A1A1A] text-[#71717A] dark:text-[#A1A1AA] flex items-center justify-center mx-auto">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">
            No customers yet.
          </h3>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">
            Get started by creating your first business customer.
          </p>
        </div>
        <Button
          onClick={onAddCustomerClick}
          size="sm"
          className="bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] hover:opacity-90 text-xs font-medium"
        >
          Add Customer
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#ECECEC] dark:border-[#232323] bg-neutral-50/50 dark:bg-[#141414]/50 text-[#71717A] dark:text-[#A1A1AA] font-medium uppercase tracking-wider">
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Address</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
            {customers.map((cust) => (
              <tr
                key={cust.id}
                className="hover:bg-neutral-50/80 dark:hover:bg-[#161616] transition-colors"
              >
                <td className="py-3 px-4 font-mono font-medium text-[#111111] dark:text-[#FAFAFA]">
                  {cust.customerCode}
                </td>
                <td className="py-3 px-4 font-medium text-[#111111] dark:text-[#FAFAFA]">
                  {cust.fullName}
                </td>
                <td className="py-3 px-4 text-[#71717A] dark:text-[#A1A1AA]">
                  {cust.phoneNumber}
                  {cust.alternatePhoneNumber && (
                    <span className="block text-[10px] opacity-70">
                      Alt: {cust.alternatePhoneNumber}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-[#71717A] dark:text-[#A1A1AA] max-w-xs truncate">
                  {cust.address}
                </td>
                <td className="py-3 px-4">
                  <CustomerStatusBadge status={cust.status} />
                </td>
                <td className="py-3 px-4 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewCustomer(cust.id)}
                    className="h-7 text-[11px] px-2.5 font-medium border-[#ECECEC] dark:border-[#232323] hover:bg-neutral-100 dark:hover:bg-[#1A1A1A] gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
