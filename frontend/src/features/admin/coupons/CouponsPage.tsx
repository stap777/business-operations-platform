import React, { useState } from 'react';
import { useCoupons, useCreateCoupon, useUpdateCoupon, useToggleCouponStatus, useDeleteCoupon } from './hooks/useCoupons';
import type { CouponRequest, CouponResponse } from './coupon.types';
import { CouponFilters } from './components/CouponFilters';
import { CouponTable } from './components/CouponTable';
import { CouponForm } from './components/CouponForm';
import { CouponDetails } from './components/CouponDetails';
import { ConfirmDeleteModal } from '../../../components/common/ConfirmDeleteModal';
import { Pagination } from '../../../components/common/Pagination';
import { Button } from '../../../components/ui/button';
import { PageHeader } from '../../../components/common/PageHeader';
import { Plus } from 'lucide-react';

export const CouponsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize] = useState<number>(10);

  // Modal / Drawer state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponResponse | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<CouponResponse | null>(null);
  const [selectedDetailsCoupon, setSelectedDetailsCoupon] = useState<CouponResponse | null>(null);

  // React Query hooks
  const { data, isLoading, isError, refetch } = useCoupons(
    searchQuery,
    activeFilter,
    currentPage,
    pageSize
  );

  const createCouponMutation = useCreateCoupon();
  const updateCouponMutation = useUpdateCoupon();
  const toggleStatusMutation = useToggleCouponStatus();
  const deleteCouponMutation = useDeleteCoupon();

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(0);
  };

  const handleStatusChange = (active?: boolean) => {
    setActiveFilter(active);
    setCurrentPage(0);
  };

  const handleFormSubmit = (payload: CouponRequest) => {
    if (editingCoupon) {
      updateCouponMutation.mutate(
        { id: editingCoupon.id, data: payload },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setEditingCoupon(null);
          },
        }
      );
    } else {
      createCouponMutation.mutate(payload, {
        onSuccess: () => {
          setIsFormOpen(false);
        },
      });
    }
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
      <PageHeader
        title="Promotional Coupons"
        description="Manage promotional discounts, discount rules, validity dates, and usage caps."
        action={
          <Button
            size="sm"
            onClick={() => {
              setEditingCoupon(null);
              setIsFormOpen(true);
            }}
            className="bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B] hover:bg-[#27272A] dark:hover:bg-[#E4E4E7] text-xs font-semibold gap-1.5 rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Create Coupon
          </Button>
        }
      />

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
        onEditCoupon={(c) => {
          setEditingCoupon(c);
          setIsFormOpen(true);
        }}
        onDeleteCoupon={(c) => setDeletingCoupon(c)}
        onToggleStatus={handleToggleStatus}
        isTogglingId={toggleStatusMutation.isPending ? (toggleStatusMutation.variables as number) : null}
        onCreateClick={() => {
          setEditingCoupon(null);
          setIsFormOpen(true);
        }}
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

      {/* Coupon Form Modal */}
      <CouponForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCoupon(null);
        }}
        onSubmit={handleFormSubmit}
        isSubmitting={createCouponMutation.isPending || updateCouponMutation.isPending}
        initialData={editingCoupon}
      />

      {/* Coupon Details Modal */}
      <CouponDetails
        coupon={selectedDetailsCoupon}
        isOpen={!!selectedDetailsCoupon}
        onClose={() => setSelectedDetailsCoupon(null)}
      />

      {/* Delete Coupon Confirmation Modal */}
      {deletingCoupon && (
        <ConfirmDeleteModal
          isOpen={!!deletingCoupon}
          onClose={() => setDeletingCoupon(null)}
          entityType="Coupon"
          entityName={deletingCoupon.code}
          isDeleting={deleteCouponMutation.isPending}
          onConfirm={() => {
            deleteCouponMutation.mutate(deletingCoupon.id, {
              onSuccess: () => setDeletingCoupon(null),
            });
          }}
        />
      )}
    </div>
  );
};

export default CouponsPage;
