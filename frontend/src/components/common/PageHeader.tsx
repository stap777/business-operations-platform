import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  secondaryAction,
  children,
  className = '',
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#09090B] dark:text-[#FAFAFA]">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-[#71717A] dark:text-[#A1A1AA]">
              {description}
            </p>
          )}
        </div>

        {(action || secondaryAction) && (
          <div className="flex items-center gap-2.5 shrink-0">
            {secondaryAction}
            {action}
          </div>
        )}
      </div>

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};
