import React from 'react';
import { Search, Filter } from 'lucide-react';
import type { UserRole, UserStatus } from '../user.types';
import { SegmentedControl } from '../../../../components/common/SegmentedControl';

interface UserFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedRole?: UserRole;
  onRoleChange: (role?: UserRole) => void;
  selectedStatus?: UserStatus;
  onStatusChange: (status?: UserStatus) => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedRole,
  onRoleChange,
  selectedStatus,
  onStatusChange,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-[#18181B] p-3 rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] shadow-xs">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search staff by name, username, phone..."
          className="w-full pl-10 pr-4 py-2 text-xs bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <select
            value={selectedRole || ''}
            onChange={(e) => onRoleChange(e.target.value ? (e.target.value as UserRole) : undefined)}
            className="appearance-none pl-3.5 pr-8 py-1.5 text-xs bg-[#F4F4F5] dark:bg-[#121214] border border-[#E4E4E7]/60 dark:border-[#27272A]/60 rounded-xl text-[#09090B] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 cursor-pointer font-medium"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Administrator</option>
            <option value="MANAGER">Sales Representative</option>
            <option value="DELIVERY">Delivery Agent</option>
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA] pointer-events-none" />
        </div>

        <SegmentedControl
          value={selectedStatus || 'ALL'}
          onChange={(val) => onStatusChange(val === 'ALL' ? undefined : (val as UserStatus))}
          options={[
            { label: 'All', value: 'ALL' },
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Inactive', value: 'INACTIVE' },
          ]}
          size="sm"
        />
      </div>
    </div>
  );
};
