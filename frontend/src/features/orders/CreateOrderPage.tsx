import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { CustomerResponse } from '../customers/customer.types';
import type { ProductResponse } from '../products/product.types';
import type { CouponResponse } from '../admin/coupons/coupon.types';
import type { OrderRequest } from './order.types';
import { useCreateOrder } from './hooks/useOrders';

import { CustomerSelector } from './components/create/CustomerSelector';
import { ProductSelector } from './components/create/ProductSelector';
import { OrderItemsTable, type SelectedOrderItem } from './components/create/OrderItemsTable';
import { CouponInput } from './components/create/CouponInput';
import { OrderTotals } from './components/create/OrderTotals';
import { DeliveryAndNotes } from './components/create/DeliveryAndNotes';
import { Button } from '../../components/ui/button';
import { Loader2, ArrowLeft, Calendar, Copy } from 'lucide-react';
import { toast } from 'sonner';

export const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponse | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedOrderItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResponse | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<string>('Cash');
  const [deliveryPersonId, setDeliveryPersonId] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>('');

  const createOrderMutation = useCreateOrder();

  // Current Date string formatting (e.g. "20 May 2025")
  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Financial Calculations
  const subtotal = selectedItems.reduce(
    (sum, item) => sum + (item.product.sellingPrice || 0) * item.quantity,
    0
  );
  const totalAmount = Math.max(0, subtotal - couponDiscount);

  // Handlers
  const handleAddProduct = (product: ProductResponse) => {
    setSelectedItems((prev) => {
      const exists = prev.find((it) => it.product.id === product.id);
      if (exists) return prev;
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    setSelectedItems((prev) =>
      prev.map((it) => (it.product.id === productId ? { ...it, quantity } : it))
    );
  };

  const handleRemoveItem = (productId: number) => {
    setSelectedItems((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const handleApplyCoupon = (coupon: CouponResponse | null, discountCalculated: number) => {
    setAppliedCoupon(coupon);
    setCouponDiscount(discountCalculated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer) {
      toast.error('Please select a customer for this order.');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Please add at least one product to the order.');
      return;
    }

    const payload: OrderRequest = {
      customerId: selectedCustomer.id,
      managerId: user?.id || 1,
      deliveryPersonId: deliveryPersonId || undefined,
      items: selectedItems.map((it) => ({
        productId: it.product.id,
        quantity: it.quantity,
      })),
      discountAmount: couponDiscount,
      deliveryInstructions: deliveryInstructions.trim() || undefined,
      notes: notes.trim() ? `[Payment: ${paymentType}] ${notes.trim()}` : `Payment: ${paymentType}`,
    };

    createOrderMutation.mutate(payload, {
      onSuccess: () => {
        navigate('/orders');
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* 1. Header Bar matching reference image */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ECECEC] dark:border-[#232323]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="p-1.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#151515] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[#111111] dark:text-[#FAFAFA]">
              Create Order
            </h1>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              Build a new order for your customer.
            </p>
          </div>
        </div>

        {/* Reference Number Callout Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] shadow-sm">
          <span>Reference: <strong className="text-[#111111] dark:text-[#FAFAFA]">Auto-generated</strong></span>
          <Copy className="w-3.5 h-3.5 text-[#71717A] cursor-pointer hover:text-[#111111] dark:hover:text-[#FAFAFA]" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 2. Top Row: Customer (Left) + Order Date & Payment Type (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Customer Selection Column (span 7) */}
          <div className="md:col-span-7">
            <CustomerSelector
              selectedCustomer={selectedCustomer}
              onSelectCustomer={setSelectedCustomer}
            />
          </div>

          {/* Order Date & Payment Type Column (span 5) */}
          <div className="md:col-span-5 space-y-4">
            {/* Order Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA] block">
                Order Date
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={todayFormatted}
                  readOnly
                  className="w-full p-2.5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] text-xs text-[#111111] dark:text-[#FAFAFA] font-mono cursor-not-allowed opacity-90"
                />
                <Calendar className="w-4 h-4 text-[#71717A] absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Payment Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA] block">
                Payment Type
              </label>
              <div className="relative">
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] text-xs text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Net Banking">Net Banking / Direct Transfer</option>
                  <option value="Credit">Customer Credit / Postpaid</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Products Section & Order Items Table */}
        <section className="space-y-3 pt-2">
          <ProductSelector
            onAddProduct={handleAddProduct}
            addedProductIds={selectedItems.map((it) => it.product.id)}
          />

          <OrderItemsTable
            items={selectedItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
          />
        </section>

        {/* 4. Bottom Grid: Coupon + Delivery/Notes (Left) & Order Totals + Action (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
          {/* Left Column (span 7): Coupon + Assign Delivery + Notes */}
          <div className="md:col-span-7 space-y-5">
            <CouponInput
              subtotal={subtotal}
              appliedCoupon={appliedCoupon}
              onApplyCoupon={handleApplyCoupon}
            />

            <DeliveryAndNotes
              selectedDeliveryPersonId={deliveryPersonId}
              onSelectDeliveryPerson={setDeliveryPersonId}
              notes={notes}
              onChangeNotes={setNotes}
              deliveryInstructions={deliveryInstructions}
              onChangeDeliveryInstructions={setDeliveryInstructions}
            />
          </div>

          {/* Right Column (span 5): Totals + Create Order Primary Action */}
          <div className="md:col-span-5 space-y-4">
            <OrderTotals
              subtotal={subtotal}
              discountAmount={couponDiscount}
              totalAmount={totalAmount}
            />

            <Button
              type="submit"
              disabled={createOrderMutation.isPending || !selectedCustomer || selectedItems.length === 0}
              className="w-full py-6 text-sm font-semibold bg-[#111111] text-white dark:bg-[#FAFAFA] dark:text-[#111111] hover:opacity-90 transition-opacity rounded-xl shadow-sm"
            >
              {createOrderMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Order...
                </span>
              ) : (
                'Create Order'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateOrderPage;
