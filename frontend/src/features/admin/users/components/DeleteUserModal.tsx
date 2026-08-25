import React, { useState } from 'react';
import type { UserResponse } from '../user.types';
import { useDeleteEmployee } from '../hooks/useUsers';
import { Button } from '../../../../components/ui/button';
import { AlertTriangle, Loader2, ShieldAlert, Trash2, X } from 'lucide-react';

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

  if (!open || !user) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121212] border border-[#ECECEC] dark:border-[#232323] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#71717A] hover:text-[#111111] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1E1E1E] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAdmin ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400' : 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400'}`}>
            {isAdmin ? <ShieldAlert className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#111111] dark:text-[#FAFAFA]">
              {isAdmin ? 'Delete Administrator' : 'Delete User Account'}
            </h3>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              @{user.username} • {user.fullName}
            </p>
          </div>
        </div>

        {/* Warning or Context message */}
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
              This account has administrative access. Deleting it will remove its access permanently.
            </p>
          </div>
        ) : (
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Are you sure you want to delete user account <strong className="text-[#111111] dark:text-[#FAFAFA]">{user.fullName}</strong> (@{user.username})? This action cannot be undone.
          </p>
        )}

        {/* Dynamic Backend Error Display */}
        {error && (
          <div className="p-3 rounded-xl border border-red-500/20 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={deleteMutation.isPending}
            className="text-xs border-[#ECECEC] dark:border-[#232323]"
          >
            Cancel
          </Button>

          <Button
            size="sm"
            onClick={handleDelete}
            disabled={isLastAdmin || deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 gap-1.5 disabled:opacity-50"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Delete User
          </Button>
        </div>
      </div>
    </div>
  );
};
