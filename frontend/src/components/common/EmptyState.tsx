import React from 'react';
import { PackageSearch } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No items found',
  description = 'Everything is currently active or no records match your criteria.',
  actionLabel,
  onAction,
  icon,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA]/50 dark:bg-[#0F0F0F]/50 my-6 ${className}`}
    >
      <div className="p-3.5 bg-[#F4F4F5] dark:bg-[#1C1C1E] text-[#71717A] dark:text-[#A1A1AA] rounded-2xl mb-3.5 border border-[#ECECEC] dark:border-[#232323]">
        {icon || <PackageSearch className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-semibold text-[#111111] dark:text-[#FAFAFA]">{title}</h3>
      <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] max-w-sm mt-1 mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 bg-[#111111] dark:bg-[#FAFAFA] hover:bg-[#27272A] dark:hover:bg-[#E4E4E7] text-white dark:text-[#111111] font-semibold text-xs rounded-xl transition-colors shadow-xs cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
