import React, { useState } from 'react';
import { useCreateProduct } from '../hooks/useProducts';
import { useCategoryDropdown } from '../hooks/useCategories';
import type { ProductUnit } from '../product.types';
import { Button } from '../../../components/ui/button';
import { X, Package, Loader2 } from 'lucide-react';

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ open, onOpenChange }) => {
  const { data: categories = [] } = useCategoryDropdown();
  const createProductMutation = useCreateProduct();

  const [formData, setFormData] = useState({
    name: '',
    categoryId: 0,
    purchasePrice: '',
    sellingPrice: '',
    availableStock: '0',
    minimumStock: '5',
    unit: 'PCS' as ProductUnit,
    trackInventory: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Product name must be at least 2 characters.';
    }

    if (!formData.categoryId || formData.categoryId === 0) {
      newErrors.categoryId = 'Please select a valid category.';
    }

    const purchase = Number(formData.purchasePrice);
    if (isNaN(purchase) || purchase < 0) {
      newErrors.purchasePrice = 'Purchase price must be non-negative.';
    }

    const selling = Number(formData.sellingPrice);
    if (isNaN(selling) || selling < 0) {
      newErrors.sellingPrice = 'Selling price must be non-negative.';
    } else if (selling < purchase) {
      newErrors.sellingPrice = `Selling price (₹${selling}) cannot be less than cost (₹${purchase}).`;
    }

    const stock = Number(formData.availableStock);
    if (isNaN(stock) || stock < 0) {
      newErrors.availableStock = 'Available stock must be non-negative.';
    }

    const minStock = Number(formData.minimumStock);
    if (isNaN(minStock) || minStock < 0) {
      newErrors.minimumStock = 'Minimum stock threshold must be non-negative.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    createProductMutation.mutate(
      {
        name: formData.name.trim(),
        categoryId: Number(formData.categoryId),
        purchasePrice: Number(formData.purchasePrice),
        sellingPrice: Number(formData.sellingPrice),
        availableStock: Number(formData.availableStock),
        minimumStock: Number(formData.minimumStock),
        unit: formData.unit,
        trackInventory: formData.trackInventory,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setFormData({
            name: '',
            categoryId: 0,
            purchasePrice: '',
            sellingPrice: '',
            availableStock: '0',
            minimumStock: '5',
            unit: 'PCS',
            trackInventory: true,
          });
          setErrors({});
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#ECECEC] dark:border-[#232323] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#1A1A1A] border border-[#ECECEC] dark:border-[#232323] flex items-center justify-center text-[#111111] dark:text-[#FAFAFA]">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">
                Add New Product
              </h2>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                Register a new inventory item in PostgreSQL database.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-[#1A1A1A]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Product Name */}
          <div>
            <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter product name..."
              className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
            />
            {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Category & Unit Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
                Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
              >
                <option value={0}>Select Category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-[10px] text-red-500 mt-1">{errors.categoryId}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
                Measurement Unit *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value as ProductUnit })}
                className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
              >
                <option value="PCS">PCS (Pieces)</option>
                <option value="BOX">BOX (Boxes)</option>
                <option value="BOTTLE">BOTTLE (Bottles)</option>
                <option value="BARREL">BARREL (Barrels)</option>
              </select>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
                Purchase / Cost Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder="310.00"
                className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
              />
              {errors.purchasePrice && (
                <p className="text-[10px] text-red-500 mt-1">{errors.purchasePrice}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                placeholder="350.00"
                className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
              />
              {errors.sellingPrice && (
                <p className="text-[10px] text-red-500 mt-1">{errors.sellingPrice}</p>
              )}
            </div>
          </div>

          {/* Stock Levels Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
                Initial Stock *
              </label>
              <input
                type="number"
                min="0"
                value={formData.availableStock}
                onChange={(e) => setFormData({ ...formData, availableStock: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
              />
              {errors.availableStock && (
                <p className="text-[10px] text-red-500 mt-1">{errors.availableStock}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
                Minimum Stock Threshold *
              </label>
              <input
                type="number"
                min="0"
                value={formData.minimumStock}
                onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
              />
              {errors.minimumStock && (
                <p className="text-[10px] text-red-500 mt-1">{errors.minimumStock}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-[#ECECEC] dark:border-[#232323] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs border-[#ECECEC] dark:border-[#232323]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createProductMutation.isPending}
              className="bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] hover:opacity-90 text-xs font-medium gap-1.5"
            >
              {createProductMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              Create Product
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
