import React, { useState, useEffect } from 'react';
import { useCreateEmployee, useUpdateEmployee } from '../hooks/useUsers';
import { Button } from '../../../../components/ui/button';
import { Loader2 } from 'lucide-react';
import type { UserResponse } from '../user.types';
import { Modal } from '../../../../components/common/Modal';

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: UserResponse | null;
}

export const UserForm: React.FC<UserFormProps> = ({ open, onOpenChange, initialData }) => {
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();

  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'DELIVERY'>('MANAGER');
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    phoneNumber: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setRole(initialData.role);
      setFormData({
        fullName: initialData.fullName,
        username: initialData.username,
        password: '',
        phoneNumber: initialData.phoneNumber,
      });
    } else {
      setRole('MANAGER');
      setFormData({ fullName: '', username: '', password: '', phoneNumber: '' });
    }
    setErrors({});
  }, [initialData, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (formData.fullName.trim().length > 100) {
      newErrors.fullName = 'Full name cannot exceed 100 characters.';
    }

    if (!initialData) {
      const usernameRegex = /^[a-zA-Z0-9._-]+$/;
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required.';
      } else if (formData.username.trim().length < 3 || formData.username.trim().length > 50) {
        newErrors.username = 'Username must be between 3 and 50 characters.';
      } else if (!usernameRegex.test(formData.username.trim())) {
        newErrors.username = 'Username can only contain letters, numbers, dots, underscores, and hyphens.';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required.';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long.';
      }
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required.';
    } else if (!phoneRegex.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Phone number must be a valid 10-digit Indian mobile number (e.g. 9876543210).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (initialData) {
      updateMutation.mutate(
        {
          id: initialData.id,
          data: {
            fullName: formData.fullName.trim(),
            phoneNumber: formData.phoneNumber.trim(),
          },
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    } else {
      createMutation.mutate(
        {
          data: {
            fullName: formData.fullName.trim(),
            username: formData.username.trim(),
            password: formData.password,
            phoneNumber: formData.phoneNumber.trim(),
          },
          role,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={initialData ? 'Edit Employee Profile' : 'Register New Employee'}
      subtitle={
        initialData
          ? 'Update contact details for staff account.'
          : 'Provision a new staff account with system credentials.'
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
            onClick={handleSubmit}
            size="sm"
            disabled={isPending}
            className="bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B] hover:bg-[#27272A] dark:hover:bg-[#E4E4E7] text-xs font-semibold gap-1.5 rounded-xl shadow-xs"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {initialData ? 'Save Changes' : role === 'ADMIN' ? 'Create Administrator' : role === 'MANAGER' ? 'Create Sales Representative' : 'Create Delivery Personnel'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {!initialData && (
          <div>
            <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
              Account Role *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'ADMIN' | 'MANAGER' | 'DELIVERY')}
              className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 cursor-pointer font-medium"
            >
              <option value="ADMIN">Administrator (Full Access)</option>
              <option value="MANAGER">Sales Representative (Orders & Payments)</option>
              <option value="DELIVERY">Delivery Personnel (Dispatch & Fulfillment)</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="e.g. Rahul Sharma"
            className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
          />
          {errors.fullName && <p className="text-[11px] text-red-500 mt-1">{errors.fullName}</p>}
        </div>

        {!initialData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="rahul_sales"
                className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
              />
              {errors.username && <p className="text-[11px] text-red-500 mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
                Initial Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 8 characters..."
                className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
              />
              {errors.password && <p className="text-[11px] text-red-500 mt-1">{errors.password}</p>}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
              Username
            </label>
            <input
              type="text"
              disabled
              value={formData.username}
              className="w-full px-3.5 py-2.5 bg-[#F4F4F5]/50 dark:bg-[#121214]/50 border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#71717A] dark:text-[#A1A1AA] cursor-not-allowed font-mono"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
            Phone Number *
          </label>
          <input
            type="text"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            placeholder="10-digit mobile number..."
            className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
          />
          {errors.phoneNumber && (
            <p className="text-[11px] text-red-500 mt-1">{errors.phoneNumber}</p>
          )}
        </div>
      </form>
    </Modal>
  );
};
