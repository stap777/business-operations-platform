import React, { useState } from 'react';
import { useResetWorkspace } from '../hooks/useBusinessSettings';
import { Button } from '../../../../components/ui/button';
import { AlertTriangle, X, Loader2, ShieldAlert, Trash2 } from 'lucide-react';

interface ResetWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ResetWorkspaceModal: React.FC<ResetWorkspaceModalProps> = ({ open, onOpenChange }) => {
  const resetMutation = useResetWorkspace();

  const [adminPassword, setAdminPassword] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const isConfirmed = confirmationText === 'DELETE MY WORKSPACE' && adminPassword.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) return;

    setError('');
    resetMutation.mutate(
      {
        adminPassword: adminPassword.trim(),
        confirmationText: confirmationText.trim(),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setAdminPassword('');
          setConfirmationText('');
          // Refresh entire app state to reflect clean workspace
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || 'Workspace reset failed.';
          setError(msg);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0F0F0F] border border-red-500/30 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 border-b border-red-500/20 bg-red-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                Permanent Workspace Reset
              </h2>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                Irreversible system data purge operation.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-[#1A1A1A]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Prominent Danger Warning Alert */}
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span>CRITICAL DATA LOSS WARNING</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              This action will <strong>permanently purge ALL enterprise business data</strong>, including:
            </p>
            <ul className="text-[11px] list-disc list-inside space-y-1 opacity-90 pl-1">
              <li>All Orders, Invoices, and Dispatch Sheets</li>
              <li>All Payments, Receivables, and Financial History</li>
              <li>All Customers, Products, Stock Adjustments, and Categories</li>
              <li>All Non-Admin Employee Accounts and Audit Logs</li>
            </ul>
            <p className="text-[11px] font-bold text-red-600 dark:text-red-400 pt-1">
              This action cannot be undone under any circumstances.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Admin Password Field */}
          <div>
            <label className="block text-[11px] font-semibold text-[#111111] dark:text-[#FAFAFA] mb-1.5">
              Administrator Password *
            </label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter your current password to authenticate"
              className="w-full px-3 py-2.5 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-red-500"
              required
            />
          </div>

          {/* Confirmation Text Field */}
          <div>
            <label className="block text-[11px] font-semibold text-[#111111] dark:text-[#FAFAFA] mb-1">
              Type <span className="font-mono text-red-600 dark:text-red-400 select-all font-bold">DELETE MY WORKSPACE</span> to confirm *
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="DELETE MY WORKSPACE"
              className="w-full px-3 py-2.5 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] font-mono placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-red-500"
              required
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#ECECEC] dark:border-[#232323] flex items-center justify-end gap-2.5">
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
              disabled={!isConfirmed || resetMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold gap-1.5 shadow-sm disabled:opacity-40"
            >
              {resetMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Purging Workspace Data...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  PERMANENTLY RESET WORKSPACE
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
