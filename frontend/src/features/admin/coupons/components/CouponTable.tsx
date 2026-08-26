import React, { useState } from 'react';
import type { CouponResponse } from '../coupon.types';
import { CouponStatusBadge, DiscountTypeBadge } from './CouponStatusBadge';
import { Button } from '../../../../components/ui/button';
import { Eye, Power, Loader2, Edit, RotateCcw } from 'lucide-react';
import { ActionDropdownMenu } from '../../../../components/common/ActionDropdownMenu';
import type { ActionMenuItem } from '../../../../components/common/ActionDropdownMenu';
import { EmptyState } from '../../../../components/common/EmptyState';
import { Modal } from '../../../../components/common/Modal';

import { TableSkeleton } from '../../../../components/common/TableSkeleton';
import { Trash2 } from 'lucide-react';

interface CouponTableProps {
  coupons: CouponResponse[];
  isLoading: boolean;
  onViewDetails: (coupon: CouponResponse) => void;
  onToggleStatus: (id: number) => void;
  onEditCoupon?: (coupon: CouponResponse) => void;
  onDeleteCoupon?: (coupon: CouponResponse) => void;
  isTogglingId?: number | null;
  onCreateClick?: () => void;
}

export const CouponTable: React.FC<CouponTableProps> = ({
  coupons,
  isLoading,
  onViewDetails,
  onToggleStatus,
  onEditCoupon,
  onDeleteCoupon,
  isTogglingId,
  onCreateClick,
}) => {
  const [confirmToggleCoupon, setConfirmToggleCoupon] = useState<CouponResponse | null>(null);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '--';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const formatDiscountValue = (coupon: CouponResponse) => {
    if (coupon.discountType === 'FLAT') {
      return `₹${coupon.discountValue.toLocaleString('en-IN')}`;
    }
    return `${coupon.discountValue}%${
      coupon.maximumDiscount ? ` (Max ₹${coupon.maximumDiscount.toLocaleString('en-IN')})` : ''
    }`;
  };

  if (isLoading) {
    return <TableSkeleton columns={7} rows={8} />;
  }

  if (!coupons || coupons.length === 0) {
    return (
      <EmptyState
        title="No coupons found"
        description="There are no promotional coupons matching your criteria."
        actionLabel="Create Coupon"
        onAction={onCreateClick}
      />
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#121214] text-[11px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Discount Value</th>
                <th className="py-3 px-4">Min. Order</th>
                <th className="py-3 px-4">Usage (Used / Cap)</th>
                <th className="py-3 px-4">Validity Window</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7]/60 dark:divide-[#27272A]/60 text-xs text-[#09090B] dark:text-[#FAFAFA]">
              {coupons.map((coupon) => {
                const isInactive = !coupon.active;

                const menuItems: ActionMenuItem[] = [
                  {
                    label: 'View Details',
                    icon: Eye,
                    onClick: () => onViewDetails(coupon),
                  },
                ];

                if (onEditCoupon) {
                  menuItems.push({
                    label: 'Edit Coupon',
                    icon: Edit,
                    onClick: () => onEditCoupon(coupon),
                  });
                }

                menuItems.push({
                  label: coupon.active ? 'Deactivate' : 'Restore',
                  icon: coupon.active ? Power : RotateCcw,
                  variant: coupon.active ? 'danger' : 'default',
                  onClick: () => setConfirmToggleCoupon(coupon),
                });

                if (onDeleteCoupon) {
                  menuItems.push({
                    label: 'Delete Coupon',
                    icon: Trash2,
                    variant: 'danger',
                    onClick: () => onDeleteCoupon(coupon),
                  });
                }

                return (
                  <tr
                    key={coupon.id}
                    className={`h-14 hover:bg-[#F4F4F5]/60 dark:hover:bg-[#27272A]/40 transition-colors ${
                      isInactive ? 'opacity-70 bg-[#FAFAFA]/50 dark:bg-black/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#09090B] dark:text-[#FAFAFA]">
                      {coupon.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <DiscountTypeBadge type={coupon.discountType} />
                    </td>
                    <td className="py-3.5 px-4 font-semibold">
                      {formatDiscountValue(coupon)}
                    </td>
                    <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA]">
                      {coupon.minimumOrderAmount
                        ? `₹${coupon.minimumOrderAmount.toLocaleString('en-IN')}`
                        : 'No min'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#71717A] dark:text-[#A1A1AA]">
                      {coupon.usedCount}{' '}
                      <span className="text-[#A1A1AA]">/ {coupon.usageLimit ?? '∞'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA] text-[11px]">
                      {formatDate(coupon.startDate)} – {formatDate(coupon.endDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      <CouponStatusBadge active={coupon.active} />
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

      {/* Confirmation Modal for Toggle Status */}
      <Modal
        isOpen={!!confirmToggleCoupon}
        onClose={() => setConfirmToggleCoupon(null)}
        title={confirmToggleCoupon?.active ? 'Deactivate Coupon?' : 'Activate Coupon?'}
        subtitle={
          confirmToggleCoupon?.active
            ? `Deactivating coupon "${confirmToggleCoupon?.code}" will prevent customers from applying it on new orders.`
            : `Activating coupon "${confirmToggleCoupon?.code}" will make it immediately available for discounts.`
        }
        maxWidth="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmToggleCoupon(null)}
              className="text-xs rounded-xl border-[#E4E4E7] dark:border-[#27272A]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isTogglingId === confirmToggleCoupon?.id}
              onClick={() => {
                if (confirmToggleCoupon) {
                  onToggleStatus(confirmToggleCoupon.id);
                  setConfirmToggleCoupon(null);
                }
              }}
              className={`text-xs font-semibold gap-1.5 rounded-xl shadow-xs ${
                confirmToggleCoupon?.active
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B]'
              }`}
            >
              {isTogglingId === confirmToggleCoupon?.id && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {confirmToggleCoupon?.active ? 'Deactivate Coupon' : 'Activate Coupon'}
            </Button>
          </>
        }
      >
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
          This operation takes effect immediately and will update coupon status in database.
        </p>
      </Modal>
    </>
  );
};
