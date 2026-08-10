import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { LogOut, Truck, Shield } from 'lucide-react';
import { AvenLogo } from '../components/aven/AvenLogo';

export const DeliveriesPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#000000] text-[#111111] dark:text-[#FAFAFA] flex flex-col">
      {/* Top Header */}
      <header className="border-b border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] px-6 py-4 flex items-center justify-between">
        <AvenLogo size="sm" />

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA]">
              {user?.fullName || user?.username}
            </p>
            <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
              {user?.role}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="text-xs font-medium gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-10 max-w-5xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111111] dark:text-[#FAFAFA]">
            Delivery Portal
          </h1>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">
            Assigned deliveries and route management.
          </p>
        </div>

        <div className="bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-[#ECECEC] dark:border-[#232323]">
            <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-[#1A1A1A] flex items-center justify-center text-[#111111] dark:text-[#FAFAFA]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">
                {user?.fullName || user?.username}
              </h2>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Delivery Staff</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323]">
              <p className="text-[#71717A] dark:text-[#A1A1AA] text-[11px]">Assigned Role</p>
              <p className="font-semibold text-[#111111] dark:text-[#FAFAFA] mt-0.5 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                {user?.role}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323]">
              <p className="text-[#71717A] dark:text-[#A1A1AA] text-[11px]">Status</p>
              <p className="font-semibold text-[#111111] dark:text-[#FAFAFA] mt-0.5">
                Active Session
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DeliveriesPage;
