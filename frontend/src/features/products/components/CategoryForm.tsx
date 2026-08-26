import React, { useState, useEffect } from 'react';
import { useCreateCategory, useUpdateCategory } from '../hooks/useCategories';
import type { CategoryResponse } from '../product.types';
import { Button } from '../../../components/ui/button';
import { Loader2 } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: CategoryResponse | null;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ open, onOpenChange, initialData }) => {
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();

  const isEditMode = !!initialData;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
      });
    } else {
      setFormData({ name: '', description: '' });
    }
    setErrors({});
  }, [initialData, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters.';
    }

    if (formData.description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
    };

    if (isEditMode && initialData) {
      updateCategoryMutation.mutate(
        { id: initialData.id, data: payload },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    } else {
      createCategoryMutation.mutate(payload, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    }
  };

  const isPending = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={isEditMode ? 'Edit Category' : 'Add Category'}
      subtitle={
        isEditMode
          ? 'Update product category details and description.'
          : 'Create a new category to group related inventory items.'
      }
      maxWidth="md"
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
            {isEditMode ? 'Save Changes' : 'Create Category'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
            Category Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Beverages, Industrial Packaging..."
            className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
          />
          {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
            Description
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Add optional notes or descriptions for this category..."
            className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 resize-none"
          />
          {errors.description && (
            <p className="text-[11px] text-red-500 mt-1">{errors.description}</p>
          )}
        </div>
      </form>
    </Modal>
  );
};
