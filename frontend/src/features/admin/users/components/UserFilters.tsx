import React from 'react';
import { Search, Filter } from 'lucide-react';
import type { UserRole, UserStatus } from '../user.types';

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
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-[#0F0F0F] p-3 rounded-xl border border-[#ECECEC] dark:border-[#232323] shadow-sm">
      {/* Search Bar */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, username, phone..."
          className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] dark:placeholder-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {/* Role Filter */}
        <div className="relative">
          <select
            value={selectedRole || ''}
            onChange={(e) => onRoleChange(e.target.value ? (e.target.value as UserRole) : undefined)}
            className="appearance-none pl-3 pr-8 py-2 text-xs bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Administrator</option>
            <option value="MANAGER">Sales Representative</option>
            <option value="DELIVERY">Delivery Personnel</option>
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA] pointer-events-none" />
        </div>

        {/* Segmented Status Control */}
        <div className="flex items-center p-0.5 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-xs">
          <button
            type="button"
            onClick={() => onStatusChange(undefined)}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              !selectedStatus
                ? 'bg-white dark:bg-[#232323] text-[#111111] dark:text-[#FAFAFA] font-medium shadow-xs'
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('ACTIVE')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              selectedStatus === 'ACTIVE'
                ? 'bg-white dark:bg-[#232323] text-emerald-600 dark:text-emerald-400 font-medium shadow-xs'
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('INACTIVE')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              selectedStatus === 'INACTIVE'
                ? 'bg-white dark:bg-[#232323] text-rose-600 dark:text-rose-400 font-medium shadow-xs'
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>
    </div>
  );
};
