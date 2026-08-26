import React, { useState, useEffect } from 'react';
import { useCreateProduct, useUpdateProduct } from '../hooks/useProducts';
import { useCategoryDropdown } from '../hooks/useCategories';
import type { ProductResponse, ProductUnit } from '../product.types';
import { Button } from '../../../components/ui/button';
import { Loader2 } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ProductResponse | null;
}

export const ProductForm: React.FC<ProductFormProps> = ({ open, onOpenChange, initialData }) => {
  const { data: categories = [] } = useCategoryDropdown();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();

  const isEditMode = !!initialData;

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

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        categoryId: initialData.categoryId || 0,
        purchasePrice: String(initialData.purchasePrice ?? ''),
        sellingPrice: String(initialData.sellingPrice ?? ''),
        availableStock: String(initialData.availableStock ?? '0'),
        minimumStock: String(initialData.minimumStock ?? '5'),
        unit: initialData.unit || 'PCS',
        trackInventory: initialData.trackInventory ?? true,
      });
    } else {
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
    }
    setErrors({});
  }, [initialData, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Product name must be at least 2 characters.';
    }

    if (!formData.categoryId || formData.categoryId === 0) {
      newErrors.categoryId = 'Please select a category.';
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

    const payload = {
      name: formData.name.trim(),
      categoryId: Number(formData.categoryId),
      purchasePrice: Number(formData.purchasePrice),
      sellingPrice: Number(formData.sellingPrice),
      availableStock: Number(formData.availableStock),
      minimumStock: Number(formData.minimumStock),
      unit: formData.unit,
      trackInventory: formData.trackInventory,
    };

    if (isEditMode && initialData) {
      updateProductMutation.mutate(
        { id: initialData.id, data: payload },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    } else {
      createProductMutation.mutate(payload, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    }
  };

  const isPending = createProductMutation.isPending || updateProductMutation.isPending;

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={isEditMode ? 'Edit Product' : 'Add New Product'}
      subtitle={
        isEditMode
          ? 'Update product details, pricing, and stock limits.'
          : 'Register a new product in your inventory catalog.'
      }
      maxWidth="xl"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs rounded-xl border-[#E4E4E7] dark:border-[#27272A]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            size="sm"
            disabled={isPending}
            className="bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B] hover:bg-[#27272A] dark:hover:bg-[#E4E4E7] text-xs font-semibold gap-1.5 rounded-xl shadow-xs"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEditMode ? 'Save Changes' : 'Create Product'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Product Name */}
        <div>
          <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
            Product Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Mineral Water Bottle 1L"
            className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
          />
          {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Category & Unit Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
              Category *
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 cursor-pointer"
            >
              <option value={0}>Select Category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-[11px] text-red-500 mt-1">{errors.categoryId}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
              Measurement Unit *
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value as ProductUnit })}
              className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 cursor-pointer"
            >
              <option value="PCS">PCS (Pieces)</option>
              <option value="BOX">BOX (Boxes)</option>
              <option value="BOTTLE">BOTTLE (Bottles)</option>
              <option value="BARREL">BARREL (Barrels)</option>
            </select>
          </div>
        </div>

        {/* Pricing Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
              Cost Price (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.purchasePrice}
              onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
              placeholder="310.00"
              className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
            />
            {errors.purchasePrice && (
              <p className="text-[11px] text-red-500 mt-1">{errors.purchasePrice}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
              Selling Price (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
              placeholder="350.00"
              className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
            />
            {errors.sellingPrice && (
              <p className="text-[11px] text-red-500 mt-1">{errors.sellingPrice}</p>
            )}
          </div>
        </div>

        {/* Stock Levels Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
              Available Stock *
            </label>
            <input
              type="number"
              min="0"
              value={formData.availableStock}
              onChange={(e) => setFormData({ ...formData, availableStock: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
            />
            {errors.availableStock && (
              <p className="text-[11px] text-red-500 mt-1">{errors.availableStock}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
              Minimum Stock Threshold *
            </label>
            <input
              type="number"
              min="0"
              value={formData.minimumStock}
              onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
            />
            {errors.minimumStock && (
              <p className="text-[11px] text-red-500 mt-1">{errors.minimumStock}</p>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
