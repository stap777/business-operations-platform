import React, { useState, useEffect } from 'react';
import {
  useUsers,
  useActivateEmployee,
  useDeactivateEmployee,
} from './hooks/useUsers';
import type { UserResponse, UserRole, UserStatus } from './user.types';
import { UserFilters } from './components/UserFilters';
import { UserTable } from './components/UserTable';
import { UserForm } from './components/UserForm';
import { UserDetails } from './components/UserDetails';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { DeleteUserModal } from './components/DeleteUserModal';
import { Pagination } from '../../../components/common/Pagination';
import { Button } from '../../../components/ui/button';
import { Plus, Users, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export const UsersPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Filters and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | undefined>();
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // Modal and drawer controls
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [selectedDetailsUserId, setSelectedDetailsUserId] = useState<number | null>(null);
  const [selectedResetUserId, setSelectedResetUserId] = useState<number | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserResponse | null>(null);

  // Query to track global count of ADMIN accounts for UI safety warnings
  const { data: adminUsersData } = useUsers({ role: 'ADMIN', size: 100 });
  const adminCount = adminUsersData?.totalElements ?? 1;

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Server state via TanStack React Query
  const { data, isLoading, isError, error, refetch } = useUsers({
    query: debouncedQuery,
    role: selectedRole,
    status: selectedStatus,
    page: currentPage,
    size: pageSize,
  });

  const activateMutation = useActivateEmployee();
  const deactivateMutation = useDeactivateEmployee();

  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-red-500/20 p-12 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-red-500 mx-auto" />
        <h3 className="text-base font-semibold text-[#111111] dark:text-[#FAFAFA]">Access Restricted</h3>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
          You do not have administrative permission to access employee management.
        </p>
      </div>
    );
  }

  const handleActivateUser = (id: number) => {
    activateMutation.mutate(id);
  };

  const handleDeactivateUser = (id: number) => {
    if (window.confirm('Deactivate this employee account? They will no longer be able to log in until reactivated.')) {
      deactivateMutation.mutate(id);
    }
  };

  const handleDeleteUser = (u: UserResponse) => {
    setUserToDelete(u);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ECECEC] dark:border-[#232323]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#111111] dark:text-[#FAFAFA]">Employees</h1>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Manage Sales Representatives and Delivery personnel accounts.
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            setEditingUser(null);
            setIsFormOpen(true);
          }}
          size="sm"
          className="bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] hover:opacity-90 text-xs font-medium gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </Button>
      </div>

      {/* Filters Bar */}
      <UserFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedRole={selectedRole}
        onRoleChange={(role) => {
          setSelectedRole(role);
          setCurrentPage(0);
        }}
        selectedStatus={selectedStatus}
        onStatusChange={(status) => {
          setSelectedStatus(status);
          setCurrentPage(0);
        }}
      />

      {/* Enterprise Employee Table */}
      <UserTable
        users={data?.content || []}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.response?.data?.message || (error as any)?.message}
        onRetry={refetch}
        onViewUser={(id) => setSelectedDetailsUserId(id)}
        onAddUserClick={() => {
          setEditingUser(null);
          setIsFormOpen(true);
        }}
        onEditUser={(userToEdit) => {
          setEditingUser(userToEdit);
          setIsFormOpen(true);
        }}
        onActivateUser={handleActivateUser}
        onDeactivateUser={handleDeactivateUser}
        onResetPassword={(id) => setSelectedResetUserId(id)}
        onDeleteUser={handleDeleteUser}
      />

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <Pagination
          currentPage={data.number}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          pageSize={data.size}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}

      {/* Add / Edit Employee Form Modal */}
      <UserForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingUser(null);
        }}
        initialData={editingUser}
      />

      {/* Employee Profile Drawer */}
      <UserDetails
        userId={selectedDetailsUserId}
        open={selectedDetailsUserId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDetailsUserId(null);
        }}
      />

      {/* Reset Password Dialog */}
      <ResetPasswordModal
        userId={selectedResetUserId}
        open={selectedResetUserId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedResetUserId(null);
        }}
      />

      {/* Delete User Safety Modal */}
      <DeleteUserModal
        user={userToDelete}
        open={userToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setUserToDelete(null);
        }}
        adminCount={adminCount}
      />
    </div>
  );
};

export default UsersPage;
