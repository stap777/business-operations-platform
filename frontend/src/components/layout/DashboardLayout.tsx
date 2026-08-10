import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AvenLogo } from '../aven/AvenLogo';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Menu, Sun, Moon } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#000000] text-[#111111] dark:text-[#FAFAFA] flex flex-col font-sans antialiased">
      {/* Top Mobile Header Bar */}
      <header className="lg:hidden sticky top-0 border-b border-[#ECECEC] dark:border-[#232323] bg-white/95 dark:bg-[#0F0F0F]/95 backdrop-blur-md px-4 py-3 flex items-center justify-between z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] text-[#111111] dark:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-[#1A1A1A] transition-colors"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <AvenLogo size="sm" />
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <span className="hidden sm:inline-block text-[10px] uppercase font-semibold font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-[#1A1A1A] text-[#71717A] dark:text-[#A1A1AA] border border-[#ECECEC] dark:border-[#232323]">
              {user.role}
            </span>
          )}
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-[#1A1A1A] transition-colors"
            title="Toggle Theme"
          >
            {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-[#1A1A1A] border border-[#ECECEC] dark:border-[#232323] flex items-center justify-center font-bold text-xs text-[#111111] dark:text-[#FAFAFA] shrink-0">
            {(user?.fullName || user?.username || 'A')[0].toUpperCase()}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Backdrop overlay for mobile drawer */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs lg:hidden z-40 transition-opacity"
          />
        )}

        {/* Single Persistent Sidebar */}
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Persistent Main Content Shell Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
