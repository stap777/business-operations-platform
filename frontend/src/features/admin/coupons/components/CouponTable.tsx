import React, { useState } from 'react';
import type { CouponResponse } from '../coupon.types';
import { CouponStatusBadge, DiscountTypeBadge } from './CouponStatusBadge';
import { Button } from '../../../../components/ui/button';
import { Eye, Power, Loader2, Tag, MoreVertical, Edit, RotateCcw } from 'lucide-react';

interface CouponTableProps {
  coupons: CouponResponse[];
  isLoading: boolean;
  onViewDetails: (coupon: CouponResponse) => void;
  onToggleStatus: (id: number) => void;
  onEditCoupon?: (coupon: CouponResponse) => void;
  isTogglingId?: number | null;
  onCreateClick?: () => void;
}

export const CouponTable: React.FC<CouponTableProps> = ({
  coupons,
  isLoading,
  onViewDetails,
  onToggleStatus,
  onEditCoupon,
  isTogglingId,
  onCreateClick,
}) => {
  const [confirmToggleCoupon, setConfirmToggleCoupon] = useState<CouponResponse | null>(null);
  const [openActionId, setOpenActionId] = useState<number | null>(null);

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

  return (
    <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl overflow-hidden shadow-sm">
      {isLoading ? (
        <div className="py-16 text-center text-xs text-[#71717A] dark:text-[#A1A1AA] flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          Loading coupons database...
        </div>
      ) : coupons.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#71717A] dark:text-[#A1A1AA] space-y-3">
          <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-[#1A1A1A] text-[#71717A] dark:text-[#A1A1AA] flex items-center justify-center mx-auto">
            <Tag className="w-5 h-5" />
          </div>
          <p className="font-medium text-[#111111] dark:text-[#FAFAFA]">No coupons found.</p>
          <p className="text-[11px] max-w-sm mx-auto text-[#71717A] dark:text-[#A1A1AA]">
            There are no active or configured promotional coupons matching your criteria.
          </p>
          {onCreateClick && (
            <Button
              onClick={onCreateClick}
              size="sm"
              className="bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] text-xs font-semibold px-4 py-2 rounded-lg mt-2"
            >
              + Create Coupon
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-50/50 dark:bg-[#151515]/50 border-b border-[#ECECEC] dark:border-[#232323] text-[#71717A] dark:text-[#A1A1AA] font-semibold text-[11px]">
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
            <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323]">
              {coupons.map((coupon) => (
                <tr
                  key={coupon.id}
                  className={`hover:bg-neutral-50 dark:hover:bg-[#151515] transition-colors ${
                    !coupon.active ? 'opacity-60 bg-neutral-50/50 dark:bg-neutral-900/30' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-[#111111] dark:text-[#FAFAFA]">
                    {coupon.code}
                  </td>
                  <td className="py-3.5 px-4">
                    <DiscountTypeBadge type={coupon.discountType} />
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#111111] dark:text-[#FAFAFA]">
                    {formatDiscountValue(coupon)}
                  </td>
                  <td className="py-3.5 px-4 text-[#111111] dark:text-[#FAFAFA]">
                    ₹{coupon.minimumOrderAmount?.toLocaleString('en-IN') || 0}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#71717A] dark:text-[#A1A1AA]">
                    <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">
                      {coupon.usedCount}
                    </span>{' '}
                    / {coupon.usageLimit}
                  </td>
                  <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA] text-[11px]">
                    {formatDate(coupon.startDate)} - {formatDate(coupon.endDate)}
                  </td>
                  <td className="py-3.5 px-4">
                    <CouponStatusBadge active={coupon.active} />
                  </td>
                  <td className="py-3.5 px-4 text-right relative">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setOpenActionId(openActionId === coupon.id ? null : coupon.id)}
                        className="p-1.5 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-[#1A1A1A] transition-colors"
                        title="Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openActionId === coupon.id && (
                        <div
                          className="absolute right-4 top-10 z-20 w-44 bg-white dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-xl shadow-lg py-1 text-xs text-left"
                          onMouseLeave={() => setOpenActionId(null)}
                        >
                          <button
                            onClick={() => {
                              setOpenActionId(null);
                              onViewDetails(coupon);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[#111111] dark:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-[#232323] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-neutral-500" />
                            View Details
                          </button>

                          {onEditCoupon && (
                            <button
                              onClick={() => {
                                setOpenActionId(null);
                                onEditCoupon(coupon);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-[#111111] dark:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-[#232323] transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5 text-blue-500" />
                              Edit Coupon
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setOpenActionId(null);
                              setConfirmToggleCoupon(coupon);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 transition-colors ${
                              coupon.active
                                ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            }`}
                          >
                            {coupon.active ? (
                              <>
                                <Power className="w-3.5 h-3.5" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-3.5 h-3.5" />
                                Activate
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal for Toggle Status */}
      {confirmToggleCoupon && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-[#111111] dark:text-[#FAFAFA]">
              {confirmToggleCoupon.active ? 'Deactivate Coupon?' : 'Activate Coupon?'}
            </h3>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
              {confirmToggleCoupon.active
                ? `Customers will no longer be able to apply coupon '${confirmToggleCoupon.code}' during order checkout.`
                : `Coupon '${confirmToggleCoupon.code}' will become active for customer orders within its validity period.`}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmToggleCoupon(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isTogglingId === confirmToggleCoupon.id}
                onClick={() => {
                  onToggleStatus(confirmToggleCoupon.id);
                  setConfirmToggleCoupon(null);
                }}
                className={`text-xs font-semibold text-white ${
                  confirmToggleCoupon.active
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isTogglingId === confirmToggleCoupon.id && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                )}
                {confirmToggleCoupon.active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
