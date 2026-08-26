import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../../products/productService';
import { customerService } from '../../customers/customerService';
import { useAuth } from '../../../context/AuthContext';
import type { OrderResponse, OrderRequest, OrderItemRequest } from '../order.types';
import { Button } from '../../../components/ui/button';
import { X, Plus, Trash2, Loader2, Edit } from 'lucide-react';

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
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [items, setItems] = useState<OrderItemRequest[]>([{ productId: 0, quantity: 1 }]);
  const [discountAmount, setDiscountAmount] = useState<string>('0');
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

  useEffect(() => {
    if (order) {
      setCustomerId(order.customerId || '');
      setDiscountAmount(String(order.discountAmount || 0));
      setDeliveryInstructions(order.deliveryInstructions || '');
      setNotes(order.notes || '');

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
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerId) {
      setErrorMsg('Please select a customer.');
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
      items: validItems,
      discountAmount: parseFloat(discountAmount) || 0,
      deliveryInstructions: deliveryInstructions.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onSubmit(order.id, payload);
  };

  const customersList = customersData?.content || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#ECECEC] dark:border-[#232323]">
          <div className="flex items-center gap-2">
            <Edit className="w-4 h-4 text-blue-500" />
            <div>
              <h2 className="text-base font-semibold text-[#111111] dark:text-[#FAFAFA]">
                Edit Order #{order.orderNumber}
              </h2>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Modify line items and order details before verification.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-xs text-red-600 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Customer Selector */}
          <div>
            <label className="font-medium text-[#111111] dark:text-[#FAFAFA] block mb-1">
              Select Customer *
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(Number(e.target.value))}
              required
              className="w-full p-2 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] text-[#111111] dark:text-[#FAFAFA]"
            >
              <option value="">-- Select Customer --</option>
              {customersList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.customerCode || `ID ${c.id}`}) — {c.phoneNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-[#111111] dark:text-[#FAFAFA]">
                Order Items *
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[11px] font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3 h-3" />
                Add Item
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={item.productId || ''}
                    onChange={(e) => handleItemChange(index, 'productId', Number(e.target.value))}
                    required
                    className="flex-1 p-2 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] text-[#111111] dark:text-[#FAFAFA]"
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
                    className="w-16 p-2 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] text-[#111111] dark:text-[#FAFAFA] font-mono text-center"
                  />

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Discount & Instructions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#111111] dark:text-[#FAFAFA] block mb-1">
                Discount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                placeholder="0.00"
                className="w-full p-2 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] text-[#111111] dark:text-[#FAFAFA] font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-[#111111] dark:text-[#FAFAFA] block mb-1">
                Delivery Note
              </label>
              <input
                type="text"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="Gate code, time window..."
                className="w-full p-2 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] text-[#111111] dark:text-[#FAFAFA]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-medium text-[#111111] dark:text-[#FAFAFA] block mb-1">
              Internal Order Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Approved by Sales Lead"
              className="w-full p-2 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#151515] text-[#111111] dark:text-[#FAFAFA]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ECECEC] dark:border-[#232323]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-8 border-[#ECECEC] dark:border-[#232323]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
              className="bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] hover:opacity-90 text-xs font-medium h-8 px-4"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
