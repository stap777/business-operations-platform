import React from 'react';

interface ResponsiveTableContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveTableContainer: React.FC<ResponsiveTableContainerProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] ${className}`}>
      {children}
    </div>
  );
};
