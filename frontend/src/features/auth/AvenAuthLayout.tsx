import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface AvenAuthLayoutProps {
  children: React.ReactNode;
  maxWidth?: 'md' | 'lg';
}

export const AvenAuthLayout: React.FC<AvenAuthLayoutProps> = ({
  children,
  maxWidth = 'md',
}) => {
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const maxWidthClass = maxWidth === 'lg' ? 'w-full max-w-2xl' : 'w-full max-w-[412px]';

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center bg-[#FAFAFA] dark:bg-[#000000] text-[#111111] dark:text-[#FAFAFA] px-4 py-6 sm:px-6 md:py-10 transition-colors duration-200">
      {/* Repositioned Floating Theme Switcher Button */}
      <button
        onClick={toggleTheme}
        type="button"
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 p-2.5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white/90 dark:bg-[#0F0F0F]/90 backdrop-blur-sm text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] transition-all duration-150 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="w-4 h-4 text-current" />
        ) : (
          <Moon className="w-4 h-4 text-current" />
        )}
      </button>

      {/* Main Content Area - Page as Container */}
      <main className={`w-full ${maxWidthClass} my-auto py-8`}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="w-full"
        >
          {children}
        </motion.div>
      </main>

      {/* Footer copyright */}
      <footer className="w-full text-center py-4">
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
          &copy; {new Date().getFullYear()} Aven. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
