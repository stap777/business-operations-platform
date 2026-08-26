import React from 'react';
import type { CustomerResponse } from '../customer.types';
import { CustomerStatusBadge } from './CustomerStatusBadge';
import { Button } from '../../../components/ui/button';
import { Eye, AlertCircle, RefreshCw, Edit, UserX, RotateCcw } from 'lucide-react';
import { ActionDropdownMenu } from '../../../components/common/ActionDropdownMenu';
import type { ActionMenuItem } from '../../../components/common/ActionDropdownMenu';
import { EmptyState } from '../../../components/common/EmptyState';

import { TableSkeleton } from '../../../components/common/TableSkeleton';
import { Trash2 } from 'lucide-react';

interface CustomerTableProps {
  customers: CustomerResponse[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onViewCustomer: (id: number) => void;
  onAddCustomerClick: () => void;
  onEditCustomer?: (customer: CustomerResponse) => void;
  onDeactivateCustomer?: (id: number) => void;
  onRestoreCustomer?: (id: number) => void;
  onDeleteCustomer?: (customer: CustomerResponse) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onViewCustomer,
  onAddCustomerClick,
  onEditCustomer,
  onDeactivateCustomer,
  onRestoreCustomer,
  onDeleteCustomer,
}) => {
  if (isLoading) {
    return <TableSkeleton columns={7} rows={8} />;
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#09090B] dark:text-[#FAFAFA]">
            Failed to Load Customers
          </h3>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1 max-w-sm mx-auto">
            {errorMessage || 'Unable to load customers list from server.'}
          </p>
        </div>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="text-xs font-medium gap-1.5 rounded-xl border-[#E4E4E7] dark:border-[#27272A]"
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
      <EmptyState
        title="No customers found"
        description="There are no customer records matching your filter parameters."
        actionLabel="Add Customer"
        onAction={onAddCustomerClick}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#121214] text-[11px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Address</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Joined Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E7]/60 dark:divide-[#27272A]/60 text-xs text-[#09090B] dark:text-[#FAFAFA]">
            {customers.map((cust) => {
              const isInactive = cust.status === 'INACTIVE';

              const menuItems: ActionMenuItem[] = [
                {
                  label: 'View Details',
                  icon: Eye,
                  onClick: () => onViewCustomer(cust.id),
                },
              ];

              if (onEditCustomer) {
                menuItems.push({
                  label: 'Edit Customer',
                  icon: Edit,
                  onClick: () => onEditCustomer(cust),
                });
              }

              if (onDeactivateCustomer && cust.status === 'ACTIVE') {
                menuItems.push({
                  label: 'Deactivate',
                  icon: UserX,
                  variant: 'danger',
                  onClick: () => onDeactivateCustomer(cust.id),
                });
              }

              if (onRestoreCustomer && cust.status === 'INACTIVE') {
                menuItems.push({
                  label: 'Restore',
                  icon: RotateCcw,
                  onClick: () => onRestoreCustomer(cust.id),
                });
              }

              if (onDeleteCustomer) {
                menuItems.push({
                  label: 'Delete Customer',
                  icon: Trash2,
                  variant: 'danger',
                  onClick: () => onDeleteCustomer(cust),
                });
              }

              return (
                <tr
                  key={cust.id}
                  className={`h-14 hover:bg-[#F4F4F5]/60 dark:hover:bg-[#27272A]/40 transition-colors ${
                    isInactive ? 'opacity-70 bg-[#FAFAFA]/50 dark:bg-black/20' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-mono font-medium text-[#71717A] dark:text-[#A1A1AA]">
                    {cust.customerCode || `CUST-${cust.id}`}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#09090B] dark:text-[#FAFAFA]">
                    {cust.fullName}
                  </td>
                  <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA]">
                    {cust.phoneNumber}
                  </td>
                  <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA] max-w-xs truncate">
                    {cust.address || '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    <CustomerStatusBadge status={cust.status} />
                  </td>
                  <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA] text-[11px]">
                    {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <ActionDropdownMenu items={menuItems} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
