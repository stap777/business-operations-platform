import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Button } from '../../../components/ui/button';
import { useCreateCustomer, useUpdateCustomer } from '../hooks/useCustomers';
import type { CustomerResponse } from '../customer.types';
import { Loader2 } from 'lucide-react';

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
          reset();
          onOpenChange(false);
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-[#0F0F0F] border-[#ECECEC] dark:border-[#232323] text-[#111111] dark:text-[#FAFAFA]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {isEditMode ? 'Edit Customer' : 'Add New Customer'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            {isEditMode ? 'Update existing business customer details.' : 'Create a new business customer record in the backend database.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA]">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('fullName')}
              placeholder="e.g. Rahul Sharma"
              className="text-xs h-9 bg-white dark:bg-[#0F0F0F] border-[#ECECEC] dark:border-[#232323]"
            />
            {errors.fullName && (
              <p className="text-[11px] text-red-500 font-medium">{errors.fullName.message}</p>
            )}
          </div>

          {/* Primary Phone */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA]">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('phoneNumber')}
              placeholder="10-digit mobile (e.g. 9876543210)"
              className="text-xs h-9 bg-white dark:bg-[#0F0F0F] border-[#ECECEC] dark:border-[#232323]"
            />
            {errors.phoneNumber && (
              <p className="text-[11px] text-red-500 font-medium">{errors.phoneNumber.message}</p>
            )}
          </div>

          {/* Alternate Phone */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA]">
              Alternate Phone Number <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-normal">(Optional)</span>
            </label>
            <Input
              {...register('alternatePhoneNumber')}
              placeholder="10-digit mobile"
              className="text-xs h-9 bg-white dark:bg-[#0F0F0F] border-[#ECECEC] dark:border-[#232323]"
            />
            {errors.alternatePhoneNumber && (
              <p className="text-[11px] text-red-500 font-medium">
                {errors.alternatePhoneNumber.message}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA]">
              Address <span className="text-red-500">*</span>
            </label>
            <Textarea
              {...register('address')}
              placeholder="Full business or delivery address"
              className="text-xs bg-white dark:bg-[#0F0F0F] border-[#ECECEC] dark:border-[#232323] min-h-[70px] resize-none"
            />
            {errors.address && (
              <p className="text-[11px] text-red-500 font-medium">{errors.address.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ECECEC] dark:border-[#232323]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] hover:opacity-90 text-xs font-medium min-w-[90px]"
            >
              {isPending ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </span>
              ) : isEditMode ? (
                'Save Changes'
              ) : (
                'Save Customer'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
