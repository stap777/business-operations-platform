import React, { useState } from 'react';
import type { UserResponse } from '../user.types';
import { useDeleteEmployee } from '../hooks/useUsers';
import { Button } from '../../../../components/ui/button';
import { AlertTriangle, Loader2, ShieldAlert, Trash2 } from 'lucide-react';
import { Modal } from '../../../../components/common/Modal';

interface DeleteUserModalProps {
  user: UserResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminCount: number;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  user,
  open,
  onOpenChange,
  adminCount,
}) => {
  const deleteMutation = useDeleteEmployee();
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';
  const isLastAdmin = isAdmin && adminCount <= 1;

  const handleClose = () => {
    setError(null);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (isLastAdmin) return;
    setError(null);

    deleteMutation.mutate(user.id, {
      onSuccess: () => {
        handleClose();
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to delete user account.';
        setError(msg);
      },
    });
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={isAdmin ? 'Delete Administrator' : 'Delete User Account'}
      subtitle={`Account: @${user.username} • ${user.fullName}`}
      maxWidth="md"
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={deleteMutation.isPending}
            className="text-xs rounded-xl border-[#E4E4E7] dark:border-[#27272A]"
          >
            Cancel
          </Button>

          <Button
            size="sm"
            onClick={handleDelete}
            disabled={isLastAdmin || deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 gap-1.5 rounded-xl shadow-xs disabled:opacity-50"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Delete User
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs">
        {isLastAdmin ? (
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Cannot delete the last administrator.</p>
              <p className="text-[11px] mt-0.5 opacity-90">
                At least one active Admin account must remain to maintain system access and administrative control.
              </p>
            </div>
          </div>
        ) : isAdmin ? (
          <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-50/30 dark:bg-amber-950/10 text-amber-800 dark:text-amber-300 text-xs space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Administrative Access Warning
            </p>
            <p className="text-[11px] opacity-90">
              This account has administrative privileges. Deleting it will remove access permanently.
            </p>
          </div>
        ) : (
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Are you sure you want to delete user account <strong className="text-[#09090B] dark:text-[#FAFAFA]">{user.fullName}</strong> (@{user.username})? This action cannot be undone.
          </p>
        )}

        {error && (
          <div className="p-3 rounded-xl border border-red-500/20 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
