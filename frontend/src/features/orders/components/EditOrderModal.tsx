import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../../products/productService';
import { customerService } from '../../customers/customerService';
import { deliveryService } from '../../delivery/deliveryService';
import { useAuth } from '../../../context/AuthContext';
import type { OrderResponse, OrderRequest, OrderItemRequest } from '../order.types';
import type { CouponResponse } from '../../admin/coupons/coupon.types';
import type { DeliveryPersonResponse } from '../../delivery/delivery.types';
import { Button } from '../../../components/ui/button';
import { Plus, Trash2, Loader2, Tag, Truck, ShoppingBag } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { CouponInput } from './create/CouponInput';

interface EditOrderModalProps {
  order: OrderResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderId: number, data: OrderRequest) => void;
  isSubmitting: boolean;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const { user } = useAuth();

  // Form State
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [deliveryPersonId, setDeliveryPersonId] = useState<number | null>(null);
  const [items, setItems] = useState<OrderItemRequest[]>([{ productId: 0, quantity: 1 }]);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResponse | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch customers dropdown
  const { data: customersData } = useQuery({
    queryKey: ['customers', 'dropdown'],
    queryFn: () => customerService.getCustomers({ page: 0, size: 100 }),
    enabled: isOpen,
  });

  // Fetch products dropdown
  const { data: products = [] } = useQuery({
    queryKey: ['products', 'dropdown'],
    queryFn: () => productService.getProductDropdown(),
    enabled: isOpen,
  });

  // Fetch delivery personnel dropdown
  const { data: deliveryPeople = [], isLoading: isDeliveryLoading } = useQuery<DeliveryPersonResponse[]>({
    queryKey: ['users', 'delivery'],
    queryFn: () => deliveryService.getDeliveryPeople(),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  // Populate order data when modal opens or order changes
  useEffect(() => {
    if (order) {
      setCustomerId(order.customerId || '');
      setDeliveryPersonId(order.deliveryPersonId ?? null);
      setDiscountAmount(order.discountAmount || 0);
      setDeliveryInstructions(order.deliveryInstructions || '');

      // Clean notes (strip payment tag prefix if present)
      let cleanedNotes = order.notes || '';
      if (cleanedNotes.startsWith('[Payment:')) {
        const closingBracketIdx = cleanedNotes.indexOf(']');
        if (closingBracketIdx !== -1) {
          cleanedNotes = cleanedNotes.substring(closingBracketIdx + 1).trim();
        }
      }
      setNotes(cleanedNotes);

      // Items
      if (order.items && order.items.length > 0) {
        setItems(
          order.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
          }))
        );
      } else {
        setItems([{ productId: 0, quantity: 1 }]);
      }

      // Applied coupon state initialization if couponCode exists
      if (order.couponCode) {
        setAppliedCoupon({
          id: 0,
          code: order.couponCode,
          discountType: 'FLAT',
          discountValue: order.discountAmount || 0,
          minimumOrderAmount: 0,
          usageLimit: 1000,
          usedCount: 1,
          active: true,
          startDate: '',
          endDate: '',
          createdAt: '',
          updatedAt: '',
        });
      } else {
        setAppliedCoupon(null);
      }
    }
  }, [order, isOpen]);

  if (!order) return null;

  // Subtotal Calculation
  const subtotal = items.reduce((sum, item) => {
    const p = products.find((prod) => prod.id === item.productId);
    const price = p ? p.sellingPrice : 0;
    return sum + price * (item.quantity || 0);
  }, 0);

  const totalAmount = Math.max(0, subtotal - discountAmount);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productId: 0, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleApplyCoupon = (coupon: CouponResponse | null, discountCalculated: number) => {
    setAppliedCoupon(coupon);
    setDiscountAmount(discountCalculated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerId) {
      setErrorMsg('Please select a customer for this order.');
      return;
    }

    const validItems = items.filter((it) => it.productId > 0 && it.quantity > 0);
    if (validItems.length === 0) {
      setErrorMsg('Order must contain at least one valid product line item.');
      return;
    }

    const payload: OrderRequest = {
      customerId: Number(customerId),
      managerId: order.managerId || user?.id || 1,
      deliveryPersonId: deliveryPersonId || undefined,
      items: validItems,
      discountAmount: discountAmount,
      couponCode: appliedCoupon?.code || undefined,
      deliveryInstructions: deliveryInstructions.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onSubmit(order.id, payload);
  };

  const customersList = customersData?.content || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Order #${order.orderNumber}`}
      subtitle="Modify line items, coupon, delivery assignment, and notes before verification lock."
      maxWidth="2xl"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs rounded-xl border-[#E4E4E7] dark:border-[#27272A]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="sm"
            className="bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B] hover:bg-[#27272A] dark:hover:bg-[#E4E4E7] text-xs font-semibold gap-1.5 rounded-xl shadow-xs"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-xs font-medium text-red-600 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        {/* 1. Customer Row */}
        <div>
          <label className="block text-xs font-semibold text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
            Customer *
          </label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(Number(e.target.value))}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E4E7]/60 dark:border-[#27272A]/60 bg-[#F4F4F5] dark:bg-[#121214] text-[#09090B] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 cursor-pointer"
          >
            <option value="">-- Select Customer --</option>
            {customersList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} ({c.customerCode || `ID ${c.id}`}) — {c.phoneNumber}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Order Items Section */}
        <div className="space-y-2.5 p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-[#09090B] dark:text-[#FAFAFA] flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Order Items *
            </label>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product Line
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {items.map((item, index) => {
              const selectedProd = products.find((p) => p.id === item.productId);
              const price = selectedProd ? selectedProd.sellingPrice : 0;
              const lineTotal = price * (item.quantity || 0);

              return (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={item.productId || ''}
                    onChange={(e) => handleItemChange(index, 'productId', Number(e.target.value))}
                    required
                    className="flex-1 px-3 py-2 rounded-xl border border-[#E4E4E7] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-[#09090B] dark:text-[#FAFAFA] focus:outline-none cursor-pointer"
                  >
                    <option value="">Select product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ₹{p.sellingPrice} (Stock: {p.availableStock})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                    placeholder="Qty"
                    className="w-20 px-3 py-2 rounded-xl border border-[#E4E4E7] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-[#09090B] dark:text-[#FAFAFA] font-mono text-center focus:outline-none"
                  />

                  <div className="w-24 text-right font-mono font-semibold text-xs text-[#09090B] dark:text-[#FAFAFA] shrink-0">
                    ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Coupons & Delivery Personnel Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Coupon Input */}
          <div className="space-y-1.5">
            <CouponInput
              subtotal={subtotal}
              appliedCoupon={appliedCoupon}
              onApplyCoupon={handleApplyCoupon}
            />
          </div>

          {/* Delivery Person Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#09090B] dark:text-[#FAFAFA] block flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-[#71717A]" />
              Assign Delivery Person <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal">(Optional)</span>
            </label>
            <select
              value={deliveryPersonId || ''}
              onChange={(e) => {
                const val = e.target.value;
                setDeliveryPersonId(val ? Number(val) : null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E4E7]/60 dark:border-[#27272A]/60 bg-[#F4F4F5] dark:bg-[#121214] text-[#09090B] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 cursor-pointer"
            >
              <option value="">Unassigned / Select later</option>
              {isDeliveryLoading ? (
                <option value="" disabled>Loading delivery staff...</option>
              ) : (
                deliveryPeople.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.fullName} ({person.phoneNumber})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* 4. Delivery Instructions & Internal Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
              Delivery Instructions
            </label>
            <input
              type="text"
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              placeholder="Gate code, time window, landmarks..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E4E7]/60 dark:border-[#27272A]/60 bg-[#F4F4F5] dark:bg-[#121214] text-[#09090B] dark:text-[#FAFAFA] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
              Internal Order Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Special pricing approved"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E4E7]/60 dark:border-[#27272A]/60 bg-[#F4F4F5] dark:bg-[#121214] text-[#09090B] dark:text-[#FAFAFA] focus:outline-none"
            />
          </div>
        </div>

        {/* 5. Financial Totals Card */}
        <div className="p-3.5 rounded-2xl bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#71717A] dark:text-[#A1A1AA]">
            <span>Subtotal:</span>
            <span className="font-mono font-medium text-[#09090B] dark:text-[#FAFAFA]">
              ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" /> Discount {appliedCoupon ? `(${appliedCoupon.code})` : ''}:
              </span>
              <span className="font-mono font-medium">
                -₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm font-bold text-[#09090B] dark:text-[#FAFAFA] pt-1 border-t border-[#E4E4E7]/60 dark:border-[#27272A]/60">
            <span>Total Order Amount:</span>
            <span className="font-mono text-base text-blue-600 dark:text-blue-400">
              ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </form>
    </Modal>
  );
};
