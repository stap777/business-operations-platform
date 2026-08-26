import React, { useState } from 'react';
import { useResetEmployeePassword } from '../hooks/useUsers';
import { Button } from '../../../../components/ui/button';
import { Loader2 } from 'lucide-react';
import { Modal } from '../../../../components/common/Modal';

interface ResetPasswordModalProps {
  userId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  userId,
  open,
  onOpenChange,
}) => {
  const resetPasswordMutation = useResetEmployeePassword();
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  if (!userId) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    resetPasswordMutation.mutate(
      {
        id: userId,
        data: { newPassword },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setNewPassword('');
          setError('');
        },
      }
    );
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Reset Employee Password"
      subtitle={`Set a new account password for employee ID #${userId}.`}
      maxWidth="sm"
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
            disabled={resetPasswordMutation.isPending}
            className="bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B] hover:bg-[#27272A] dark:hover:bg-[#E4E4E7] text-xs font-semibold gap-1.5 rounded-xl shadow-xs"
          >
            {resetPasswordMutation.isPending && (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            )}
            Update Password
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-xs font-medium text-[#09090B] dark:text-[#FAFAFA] mb-1.5">
            New Password *
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setError('');
            }}
            placeholder="Minimum 8 characters..."
            className="w-full px-3.5 py-2.5 bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
          />
          {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
        </div>
      </form>
    </Modal>
  );
};
