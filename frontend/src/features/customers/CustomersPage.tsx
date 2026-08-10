import React, { useState } from 'react';
import { useCustomers } from './hooks/useCustomers';
import { CustomerFilters } from './components/CustomerFilters';
import { CustomerTable } from './components/CustomerTable';
import { CustomerForm } from './components/CustomerForm';
import { CustomerDetails } from './components/CustomerDetails';
import { Button } from '../../components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const customersQuery = useCustomers({
    query: searchQuery,
    page,
    size: pageSize,
  });

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(0);
  };

  const handleViewCustomer = (id: number) => {
    setSelectedCustomerId(id);
    setIsDetailsModalOpen(true);
  };

  return (
    <>
      {/* Page Title & Main Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ECECEC] dark:border-[#232323]">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111111] dark:text-[#FAFAFA]">
            Customers
          </h1>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">
            Manage your customer relationships.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          size="sm"
          className="bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] hover:opacity-90 text-xs font-medium gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <CustomerFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
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
        onAddCustomerClick={() => setIsAddModalOpen(true)}
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
        onOpenChange={setIsAddModalOpen}
      />

      <CustomerDetails
        customerId={selectedCustomerId}
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
      />
    </>
  );
};

export default CustomersPage;
