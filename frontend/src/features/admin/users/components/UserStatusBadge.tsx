import React from 'react';
import type { UserRole, UserStatus } from '../user.types';
import { StatusBadge } from '../../../../components/common/StatusBadge';

interface UserStatusBadgeProps {
  status?: UserStatus;
  role?: UserRole;
}

export const UserRoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  return <StatusBadge status={role === 'MANAGER' ? 'SALES_REPRESENTATIVE' : role} size="sm" />;
};

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ status, role }) => {
  if (role) {
    return <UserRoleBadge role={role} />;
  }

  return <StatusBadge status={status || 'ACTIVE'} size="sm" />;
};
