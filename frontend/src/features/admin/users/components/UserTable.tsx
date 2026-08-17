import React from 'react';
import type { UserResponse } from '../user.types';
import { UserRoleBadge, UserStatusBadge } from './UserStatusBadge';
import { Eye, Plus, UserX, UserCheck, Key, RefreshCw } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

interface UserTableProps {
  users: UserResponse[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onViewUser: (id: number) => void;
  onAddUserClick: () => void;
  onActivateUser: (id: number) => void;
  onDeactivateUser: (id: number) => void;
  onResetPassword: (id: number) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onViewUser,
  onAddUserClick,
  onActivateUser,
  onDeactivateUser,
  onResetPassword,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-[#ECECEC] dark:border-[#232323] p-12 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-[#71717A] dark:text-[#A1A1AA]" />
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Loading employee records...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-red-500/20 p-8 text-center space-y-3">
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
          {errorMessage || 'Failed to load employee accounts from server.'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="text-xs border-[#ECECEC] dark:border-[#232323]"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-[#ECECEC] dark:border-[#232323] p-12 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] flex items-center justify-center mx-auto text-[#71717A]">
          <UserX className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">No employees yet.</h3>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">
            Get started by registering your first Sales Representative or Delivery account.
          </p>
        </div>
        <Button
          onClick={onAddUserClick}
          size="sm"
          className="bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] hover:opacity-90 text-xs font-medium gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-[#ECECEC] dark:border-[#232323] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#121212] text-[11px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
              <th className="py-3 px-4">Employee Name</th>
              <th className="py-3 px-4">Username</th>
              <th className="py-3 px-4">Phone Number</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Created At</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECECEC] dark:divide-[#232323] text-xs text-[#111111] dark:text-[#FAFAFA]">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-neutral-50 dark:hover:bg-[#151515] transition-colors"
              >
                <td className="py-3.5 px-4 font-semibold text-[#111111] dark:text-[#FAFAFA]">
                  {user.fullName}
                </td>
                <td className="py-3.5 px-4 font-mono text-[#71717A] dark:text-[#A1A1AA]">
                  @{user.username}
                </td>
                <td className="py-3.5 px-4 font-mono text-[#71717A] dark:text-[#A1A1AA]">
                  {user.phoneNumber}
                </td>
                <td className="py-3.5 px-4">
                  <UserRoleBadge role={user.role} />
                </td>
                <td className="py-3.5 px-4">
                  <UserStatusBadge status={user.status} />
                </td>
                <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA] text-[11px]">
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onViewUser(user.id)}
                      className="p-1.5 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-[#1A1A1A] transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onResetPassword(user.id)}
                      className="p-1.5 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-[#1A1A1A] transition-colors"
                      title="Reset Password"
                    >
                      <Key className="w-4 h-4" />
                    </button>

                    {user.status === 'ACTIVE' ? (
                      <button
                        onClick={() => onDeactivateUser(user.id)}
                        className="p-1.5 rounded-lg text-[#71717A] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Deactivate Account"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onActivateUser(user.id)}
                        className="p-1.5 rounded-lg text-[#71717A] hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                        title="Activate Account"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
