import React from 'react';
import type { UserResponse } from '../user.types';
import { UserRoleBadge, UserStatusBadge } from './UserStatusBadge';
import { Eye, UserX, Key, RefreshCw, Trash2, Edit, RotateCcw } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { ActionDropdownMenu } from '../../../../components/common/ActionDropdownMenu';
import type { ActionMenuItem } from '../../../../components/common/ActionDropdownMenu';
import { EmptyState } from '../../../../components/common/EmptyState';

import { TableSkeleton } from '../../../../components/common/TableSkeleton';

interface UserTableProps {
  users: UserResponse[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onViewUser: (id: number) => void;
  onAddUserClick: () => void;
  onEditUser?: (user: UserResponse) => void;
  onActivateUser: (id: number) => void;
  onDeactivateUser: (id: number) => void;
  onResetPassword: (id: number) => void;
  onDeleteUser: (user: UserResponse) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onViewUser,
  onAddUserClick,
  onEditUser,
  onActivateUser,
  onDeactivateUser,
  onResetPassword,
  onDeleteUser,
}) => {
  if (isLoading) {
    return <TableSkeleton columns={7} rows={8} />;
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-red-500/20 p-8 text-center space-y-3">
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
          {errorMessage || 'Failed to load employee accounts from server.'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="text-xs rounded-xl border-[#E4E4E7] dark:border-[#27272A]"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <EmptyState
        title="No employees found"
        description="There are no employee account records matching your filters."
        actionLabel="Add Employee"
        onAction={onAddUserClick}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#121214] text-[11px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
              <th className="py-3 px-4">Employee Name</th>
              <th className="py-3 px-4">Username</th>
              <th className="py-3 px-4">Phone Number</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Created At</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E7]/60 dark:divide-[#27272A]/60 text-xs text-[#09090B] dark:text-[#FAFAFA]">
            {users.map((user) => {
              const isInactive = user.status === 'INACTIVE';

              const menuItems: ActionMenuItem[] = [
                {
                  label: 'View Profile',
                  icon: Eye,
                  onClick: () => onViewUser(user.id),
                },
              ];

              if (onEditUser) {
                menuItems.push({
                  label: 'Edit Employee',
                  icon: Edit,
                  onClick: () => onEditUser(user),
                });
              }

              menuItems.push({
                label: 'Reset Password',
                icon: Key,
                onClick: () => onResetPassword(user.id),
              });

              if (user.status === 'ACTIVE') {
                menuItems.push({
                  label: 'Deactivate',
                  icon: UserX,
                  variant: 'danger',
                  onClick: () => onDeactivateUser(user.id),
                });
              } else {
                menuItems.push({
                  label: 'Restore',
                  icon: RotateCcw,
                  onClick: () => onActivateUser(user.id),
                });
              }

              menuItems.push({
                label: 'Delete User',
                icon: Trash2,
                variant: 'danger',
                onClick: () => onDeleteUser(user),
              });

              return (
                <tr
                  key={user.id}
                  className={`h-14 hover:bg-[#F4F4F5]/60 dark:hover:bg-[#27272A]/40 transition-colors ${
                    isInactive ? 'opacity-70 bg-[#FAFAFA]/50 dark:bg-black/20' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-semibold text-[#09090B] dark:text-[#FAFAFA]">
                    {user.fullName}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-[#71717A] dark:text-[#A1A1AA]">
                    {user.username}
                  </td>
                  <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA]">
                    {user.phoneNumber || '—'}
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
                    <ActionDropdownMenu items={menuItems} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
