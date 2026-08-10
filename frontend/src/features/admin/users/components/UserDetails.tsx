import React from 'react';
import { useUserDetails } from '../hooks/useUsers';
import { UserRoleBadge, UserStatusBadge } from './UserStatusBadge';
import { Button } from '../../../../components/ui/button';
import { X, User, Loader2, Calendar, Phone, ShieldCheck } from 'lucide-react';

interface UserDetailsProps {
  userId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserDetails: React.FC<UserDetailsProps> = ({ userId, open, onOpenChange }) => {
  const { data: user, isLoading, isError } = useUserDetails(open ? userId : null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="bg-white dark:bg-[#0F0F0F] border-l border-[#ECECEC] dark:border-[#232323] w-full max-w-md h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-[#ECECEC] dark:border-[#232323] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-[#1A1A1A] border border-[#ECECEC] dark:border-[#232323] flex items-center justify-center text-[#111111] dark:text-[#FAFAFA]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#111111] dark:text-[#FAFAFA]">
                Employee Profile
              </h2>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                ID: EMP-{user?.id || userId}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-[#1A1A1A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#71717A]" />
              <p className="text-xs text-[#71717A]">Fetching employee profile...</p>
            </div>
          ) : isError || !user ? (
            <div className="py-12 text-center text-xs text-red-500">
              Unable to load employee profile from server.
            </div>
          ) : (
            <>
              {/* Profile Card */}
              <div className="bg-[#FAFAFA] dark:bg-[#151515] p-4 rounded-xl border border-[#ECECEC] dark:border-[#232323] space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#111111] dark:text-[#FAFAFA]">
                      {user.fullName}
                    </h3>
                    <p className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                      @{user.username}
                    </p>
                  </div>
                  <UserStatusBadge status={user.status} />
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#ECECEC] dark:border-[#232323]">
                  <UserRoleBadge role={user.role} />
                  <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                    {user.firstLogin ? 'First login pending' : 'Password configured'}
                  </span>
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-4 text-xs">
                <h4 className="text-[11px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                  Contact & Credentials Information
                </h4>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between py-2 border-b border-[#ECECEC] dark:border-[#232323]">
                    <span className="text-[#71717A] dark:text-[#A1A1AA]">Phone Number</span>
                    <span className="font-mono font-medium text-[#111111] dark:text-[#FAFAFA] flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#71717A]" />
                      {user.phoneNumber}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[#ECECEC] dark:border-[#232323]">
                    <span className="text-[#71717A] dark:text-[#A1A1AA]">System Role</span>
                    <span className="font-medium text-[#111111] dark:text-[#FAFAFA] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                      {user.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[#ECECEC] dark:border-[#232323]">
                    <span className="text-[#71717A] dark:text-[#A1A1AA]">Created Date</span>
                    <span className="font-medium text-[#111111] dark:text-[#FAFAFA] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(user.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[#ECECEC] dark:border-[#232323]">
                    <span className="text-[#71717A] dark:text-[#A1A1AA]">Last Updated</span>
                    <span className="font-medium text-[#111111] dark:text-[#FAFAFA]">
                      {new Date(user.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#ECECEC] dark:border-[#232323]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full text-xs border-[#ECECEC] dark:border-[#232323]"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
