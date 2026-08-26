import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../components/ui/button';
import { useCreateCustomer, useUpdateCustomer } from '../hooks/useCustomers';
import type { CustomerResponse } from '../customer.types';
import { Loader2 } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';

const customerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full Name must be at least 2 characters')
    .max(100, 'Full Name must not exceed 100 characters'),
  phoneNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit mobile number (starting with 6-9)'),
  alternatePhoneNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[6-9]\d{9}$/.test(val),
      'Alternate phone must be a valid 10-digit mobile number'
    ),
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address must not exceed 500 characters'),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: CustomerResponse | null;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ open, onOpenChange, initialData }) => {
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

  const isEditMode = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      alternatePhoneNumber: '',
      address: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        fullName: initialData.fullName || '',
        phoneNumber: initialData.phoneNumber || '',
        alternatePhoneNumber: initialData.alternatePhoneNumber || '',
        address: initialData.address || '',
      });
    } else {
      reset({
        fullName: '',
        phoneNumber: '',
        alternatePhoneNumber: '',
        address: '',
      });
    }
  }, [initialData, open, reset]);

  const onSubmit = (data: CustomerFormData) => {
    const payload = {
      fullName: data.fullName.trim(),
      phoneNumber: data.phoneNumber.trim(),
      alternatePhoneNumber: data.alternatePhoneNumber?.trim() || null,
      address: data.address.trim(),
    };

    if (isEditMode && initialData) {
      updateMutation.mutate(
        { id: initialData.id, data: payload },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={isEditMode ? 'Edit Customer' : 'Add New Customer'}
      subtitle={
        isEditMode
          ? 'Update business customer contact details and address.'
          : 'Create a new customer account record.'
      }
      maxWidth="lg"
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
            onClick={handleSubmit(onSubmit)}
            size="sm"
            disabled={isPending}
            className="bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B] hover:bg-[#27272A] dark:hover:bg-[#E4E4E7] text-xs font-semibold gap-1.5 rounded-xl shadow-xs"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEditMode ? 'Save Changes' : 'Create Customer'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        <div>
          <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
            Full Name *
          </label>
          <input
            {...register('fullName')}
            placeholder="Enter customer full name..."
            className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
          />
          {errors.fullName && (
            <p className="text-[11px] text-red-500 mt-1">{errors.fullName.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
              Primary Phone Number *
            </label>
            <input
              {...register('phoneNumber')}
              placeholder="e.g. 9876543210"
              className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
            />
            {errors.phoneNumber && (
              <p className="text-[11px] text-red-500 mt-1">{errors.phoneNumber.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
              Alternate Phone (Optional)
            </label>
            <input
              {...register('alternatePhoneNumber')}
              placeholder="e.g. 9123456789"
              className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
            />
            {errors.alternatePhoneNumber && (
              <p className="text-[11px] text-red-500 mt-1">
                {errors.alternatePhoneNumber.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
            Complete Delivery Address *
          </label>
          <textarea
            {...register('address')}
            rows={3}
            placeholder="Enter shop or delivery address..."
            className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 resize-none"
          />
          {errors.address && (
            <p className="text-[11px] text-red-500 mt-1">{errors.address.message}</p>
          )}
        </div>
      </form>
    </Modal>
  );
};
