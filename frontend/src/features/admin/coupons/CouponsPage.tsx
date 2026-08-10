import React, { useState } from 'react';
import { useCoupons, useCreateCoupon, useToggleCouponStatus } from './hooks/useCoupons';
import type { CouponRequest, CouponResponse } from './coupon.types';
import { CouponFilters } from './components/CouponFilters';
import { CouponTable } from './components/CouponTable';
import { CouponForm } from './components/CouponForm';
import { CouponDetails } from './components/CouponDetails';
import { Pagination } from '../../../components/common/Pagination';
import { Button } from '../../../components/ui/button';
import { Plus, Tag } from 'lucide-react';

export const CouponsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize] = useState<number>(10);

  // Modal / Drawer state
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedDetailsCoupon, setSelectedDetailsCoupon] = useState<CouponResponse | null>(null);

  // React Query hooks
  const { data, isLoading, isError, refetch } = useCoupons(
    searchQuery,
    activeFilter,
    currentPage,
    pageSize
  );

  const createCouponMutation = useCreateCoupon();
  const toggleStatusMutation = useToggleCouponStatus();

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(0);
  };

  const handleStatusChange = (active?: boolean) => {
    setActiveFilter(active);
    setCurrentPage(0);
  };

  const handleCreateSubmit = (payload: CouponRequest) => {
    createCouponMutation.mutate(payload, {
      onSuccess: () => {
        setIsCreateOpen(false);
      },
    });
  };

  const handleToggleStatus = (id: number) => {
    toggleStatusMutation.mutate(id);
  };

  const coupons = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ECECEC] dark:border-[#232323]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-[#FAFAFA]">
              Coupons
            </h1>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              Manage promotional discounts, discount rules, and coupon limits.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </Button>
      </div>

      {/* Filters Bar */}
      <CouponFilters
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        initialQuery={searchQuery}
        initialActive={activeFilter}
      />

      {/* Error state if server error */}
      {isError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
          <span>Failed to load coupons from backend database.</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs h-7">
            Retry
          </Button>
        </div>
      )}

      {/* Coupons Table */}
      <CouponTable
        coupons={coupons}
        isLoading={isLoading}
        onViewDetails={(c) => setSelectedDetailsCoupon(c)}
        onToggleStatus={handleToggleStatus}
        isTogglingId={toggleStatusMutation.isPending ? (toggleStatusMutation.variables as number) : null}
        onCreateClick={() => setIsCreateOpen(true)}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}

      {/* Create Coupon Modal */}
      <CouponForm
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        isSubmitting={createCouponMutation.isPending}
      />

      {/* Coupon Details Modal */}
      <CouponDetails
        coupon={selectedDetailsCoupon}
        isOpen={!!selectedDetailsCoupon}
        onClose={() => setSelectedDetailsCoupon(null)}
      />
    </div>
  );
};

export default CouponsPage;
