import React from 'react';
import type { ProductStatus, CategoryStatus } from '../product.types';
import { StatusBadge } from '../../../components/common/StatusBadge';

interface ProductStatusBadgeProps {
  status: ProductStatus | CategoryStatus;
  isLowStock?: boolean;
}

export const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({
  status,
  isLowStock,
}) => {
  if (isLowStock) {
    return <StatusBadge status="LOW_STOCK" size="sm" />;
  }

  return <StatusBadge status={status} size="sm" />;
};
