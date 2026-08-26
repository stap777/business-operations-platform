import React from 'react';
import type { CustomerStatus } from '../customer.types';
import { StatusBadge } from '../../../components/common/StatusBadge';

interface CustomerStatusBadgeProps {
  status: CustomerStatus;
}

export const CustomerStatusBadge: React.FC<CustomerStatusBadgeProps> = ({ status }) => {
  return <StatusBadge status={status} size="sm" />;
};
