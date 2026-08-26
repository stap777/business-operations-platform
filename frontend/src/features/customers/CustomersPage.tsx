import React, { useState } from 'react';
import { useCustomers, useDeactivateCustomer, useRestoreCustomer, useDeleteCustomer } from './hooks/useCustomers';
import { CustomerFilters } from './components/CustomerFilters';
import { CustomerTable } from './components/CustomerTable';
import { CustomerForm } from './components/CustomerForm';
import { CustomerDetails } from './components/CustomerDetails';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/common/PageHeader';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CustomerResponse, CustomerStatus } from './customer.types';

export const CustomersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerResponse | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerResponse | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const customersQuery = useCustomers({
    query: searchQuery,
    status: statusFilter,
    page,
    size: pageSize,
  });

  const deactivateMutation = useDeactivateCustomer();
  const restoreMutation = useRestoreCustomer();
  const deleteMutation = useDeleteCustomer();

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(0);
  };

  const handleStatusChange = (status?: CustomerStatus) => {
    setStatusFilter(status);
    setPage(0);
  };

  const handleViewCustomer = (id: number) => {
    setSelectedCustomerId(id);
    setIsDetailsModalOpen(true);
  };

  return (
    <>
      {/* Page Title & Main Action Header */}
      <PageHeader
        title="Customers"
        description="Manage customer records, contact information, credit ledgers, and account status."
        action={
          <Button
            onClick={() => {
              setEditingCustomer(null);
              setIsAddModalOpen(true);
            }}
            size="sm"
            className="bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B] hover:bg-[#27272A] dark:hover:bg-[#E4E4E7] text-xs font-semibold gap-1.5 rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        }
      />

      {/* Search & Filter Bar */}
      <CustomerFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        selectedStatus={statusFilter}
        onStatusChange={handleStatusChange}
      />

      {/* Customer Table */}
      <CustomerTable
        customers={customersQuery.data?.content || []}
        isLoading={customersQuery.isLoading}
        isError={customersQuery.isError}
        errorMessage={
          customersQuery.error instanceof Error
            ? customersQuery.error.message
            : undefined
        }
        onRetry={() => customersQuery.refetch()}
        onViewCustomer={handleViewCustomer}
        onAddCustomerClick={() => {
          setEditingCustomer(null);
          setIsAddModalOpen(true);
        }}
        onEditCustomer={(customer) => {
          setEditingCustomer(customer);
          setIsAddModalOpen(true);
        }}
        onDeactivateCustomer={(id) => deactivateMutation.mutate(id)}
        onRestoreCustomer={(id) => restoreMutation.mutate(id)}
        onDeleteCustomer={(customer) => setDeletingCustomer(customer)}
      />

      {/* Pagination Controls */}
      {customersQuery.data && customersQuery.data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-[#71717A] dark:text-[#A1A1AA]">
          <div>
            Showing page <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{customersQuery.data.number + 1}</span> of{' '}
            <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{customersQuery.data.totalPages}</span> ({customersQuery.data.totalElements} total records)
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={customersQuery.data.first || customersQuery.isFetching}
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              className="h-8 text-xs font-medium gap-1 border-[#ECECEC] dark:border-[#232323]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={customersQuery.data.last || customersQuery.isFetching}
              onClick={() => setPage((prev) => prev + 1)}
              className="h-8 text-xs font-medium gap-1 border-[#ECECEC] dark:border-[#232323]"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CustomerForm
        open={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) setEditingCustomer(null);
        }}
        initialData={editingCustomer}
      />

      <CustomerDetails
        customerId={selectedCustomerId}
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
      />

      {/* Delete Customer Confirmation Modal */}
      {deletingCustomer && (
        <ConfirmDeleteModal
          isOpen={!!deletingCustomer}
          onClose={() => setDeletingCustomer(null)}
          entityType="Customer"
          entityName={deletingCustomer.fullName}
          isDeleting={deleteMutation.isPending}
          warningText="Customers with transaction history (orders or invoices) cannot be deleted."
          onConfirm={() => {
            deleteMutation.mutate(deletingCustomer.id, {
              onSuccess: () => setDeletingCustomer(null),
            });
          }}
        />
      )}
    </>
  );
};

export default CustomersPage;
