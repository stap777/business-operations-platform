import React from 'react';
import type { UserRole, UserStatus } from '../user.types';

interface UserStatusBadgeProps {
  status?: UserStatus;
  role?: UserRole;
}

export const UserRoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  if (role === 'ADMIN') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
        Admin
      </span>
    );
  }

  if (role === 'MANAGER') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        Manager
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
      Delivery
    </span>
  );
};

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ status, role }) => {
  if (role) {
    return <UserRoleBadge role={role} />;
  }

  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20">
      Inactive
    </span>
  );
};
