import React from 'react';

export const VersionFooter: React.FC = () => {
  return (
    <footer className="mt-8 pt-4 pb-6 border-t border-[#ECECEC] dark:border-[#232323] text-center print:hidden">
      <p className="text-[11px] font-medium text-[#71717A] dark:text-[#A1A1AA]">
        Business Management System <span className="mx-1">•</span> <span className="font-mono font-semibold text-[#111111] dark:text-[#FAFAFA]">v1.0.0</span>
      </p>
    </footer>
  );
};
