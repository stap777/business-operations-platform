import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value?: string | number;
  icon?: LucideIcon;
  subtitle?: string;
  isLoading?: boolean;
  error?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  isLoading,
  error,
}) => {
  return (
    <div className="p-4 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-2 transition-all hover:border-neutral-300 dark:hover:border-neutral-700">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
          {title}
        </span>
        {Icon && (
          <div className="p-1.5 rounded-md bg-[#FAFAFA] dark:bg-[#151515] text-[#71717A] dark:text-[#A1A1AA]">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-1.5 py-1">
          <div className="h-6 w-28 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          <div className="h-3 w-16 bg-neutral-100 dark:bg-neutral-900 rounded animate-pulse" />
        </div>
      ) : error ? (
        <div className="py-1">
          <span className="text-xs text-red-500 font-medium">Failed to load</span>
        </div>
      ) : (
        <div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111] dark:text-[#FAFAFA]">
            {value ?? '0'}
          </div>
          {subtitle && (
            <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
