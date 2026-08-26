import React from 'react';

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ columns = 5, rows = 6 }) => {
  return (
    <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] overflow-hidden shadow-xs animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#121214]">
              {Array.from({ length: columns }).map((_, idx) => (
                <th key={idx} className="py-3 px-4">
                  <div className="h-3 bg-[#E4E4E7] dark:bg-[#27272A] rounded w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E7]/60 dark:divide-[#27272A]/60">
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx} className="h-14">
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <td key={colIdx} className="py-3.5 px-4">
                    <div className="h-3.5 bg-[#F4F4F5] dark:bg-[#27272A] rounded w-full max-w-[120px]" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
