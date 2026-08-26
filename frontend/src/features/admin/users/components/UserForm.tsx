import React, { useState, useEffect } from 'react';
import { useCreateEmployee, useUpdateEmployee } from '../hooks/useUsers';
import { Button } from '../../../../components/ui/button';
import { X, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import type { UserResponse } from '../user.types';

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

  if (!open) return null;

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
            username: formData.username.trim().toLowerCase(),
            password: formData.password,
            phoneNumber: formData.phoneNumber.trim(),
          },
          role,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            setFormData({ fullName: '', username: '', password: '', phoneNumber: '' });
            setRole('MANAGER');
            setErrors({});
          },
        }
      );
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#ECECEC] dark:border-[#232323] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#1A1A1A] border border-[#ECECEC] dark:border-[#232323] flex items-center justify-center text-[#111111] dark:text-[#FAFAFA]">
              {initialData ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">
                {initialData ? 'Edit Employee Profile' : 'Add New Employee'}
              </h2>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                {initialData
                  ? `Update employee profile details for @${initialData.username}`
                  : 'Create an administrator, sales representative, or delivery staff account.'}
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
          {/* Role Selector Tabs (ADMIN, MANAGER & DELIVERY) - Readonly in Edit Mode */}
          {!initialData && (
            <div>
              <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1.5">
                Employee Role *
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg">
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                    role === 'ADMIN'
                      ? 'bg-white dark:bg-[#232323] text-[#111111] dark:text-[#FAFAFA] shadow-sm'
                      : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setRole('MANAGER')}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                    role === 'MANAGER'
                      ? 'bg-white dark:bg-[#232323] text-[#111111] dark:text-[#FAFAFA] shadow-sm'
                      : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
                  }`}
                >
                  Sales Rep
                </button>
                <button
                  type="button"
                  onClick={() => setRole('DELIVERY')}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                    role === 'DELIVERY'
                      ? 'bg-white dark:bg-[#232323] text-[#111111] dark:text-[#FAFAFA] shadow-sm'
                      : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
                  }`}
                >
                  Delivery
                </button>
              </div>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
            />
            {errors.fullName && <p className="text-[10px] text-red-500 mt-1">{errors.fullName}</p>}
          </div>

          {/* Username & Phone Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
                Username {initialData ? '(Read-only)' : '*'}
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="rahul.sharma"
                disabled={!!initialData}
                className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] disabled:opacity-60"
              />
              {errors.username && <p className="text-[10px] text-red-500 mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="9876543210"
                className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
              />
              {errors.phoneNumber && (
                <p className="text-[10px] text-red-500 mt-1">{errors.phoneNumber}</p>
              )}
            </div>
          </div>

          {/* Password (Creation Only) */}
          {!initialData && (
            <div>
              <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
                Initial Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 8 characters"
                className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
              />
              {errors.password && <p className="text-[10px] text-red-500 mt-1">{errors.password}</p>}
            </div>
          )}

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
              disabled={isSubmitting}
              className="bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] hover:opacity-90 text-xs font-medium gap-1.5"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {initialData
                ? 'Save Changes'
                : `Create ${role === 'ADMIN' ? 'Administrator' : role === 'MANAGER' ? 'Sales Representative' : 'Delivery Account'}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
