import React from 'react';

interface FinancialMetricCardProps {
  title: string;
  amount: number;
  subtitle?: string;
  marginPercentage?: number;
  type?: 'neutral' | 'revenue' | 'cogs' | 'profit' | 'loss' | 'opex';
  isLoss?: boolean;
}

export const FinancialMetricCard: React.FC<FinancialMetricCardProps> = ({
  title,
  amount,
  subtitle,
  marginPercentage,
  type = 'neutral',
  isLoss = false,
}) => {
  const formattedAmount = `₹${(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const getBorderColor = () => {
    if (type === 'profit' && !isLoss) return 'border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/10';
    if (isLoss || type === 'loss') return 'border-red-500/30 dark:border-red-500/20 bg-red-50/50 dark:bg-red-950/10';
    if (type === 'revenue') return 'border-blue-500/20 dark:border-blue-500/20 bg-white dark:bg-[#0F0F0F]';
    if (type === 'cogs') return 'border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F]';
    if (type === 'opex') return 'border-amber-500/20 dark:border-amber-500/20 bg-white dark:bg-[#0F0F0F]';
    return 'border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F]';
  };

  const getTitleColor = () => {
    if (isLoss || type === 'loss') return 'text-red-700 dark:text-red-400';
    if (type === 'profit' && !isLoss) return 'text-emerald-700 dark:text-emerald-400';
    return 'text-[#71717A] dark:text-[#A1A1AA]';
  };

  const getValueColor = () => {
    if (isLoss || type === 'loss') return 'text-red-600 dark:text-red-400';
    if (type === 'profit' && !isLoss) return 'text-emerald-600 dark:text-emerald-400';
    return 'text-[#111111] dark:text-[#FAFAFA]';
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-xl border ${getBorderColor()} shadow-xs transition-all flex flex-col justify-between space-y-2`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[11px] font-semibold uppercase tracking-wider ${getTitleColor()}`}>
          {title}
        </span>
        {isLoss ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            Loss
          </span>
        ) : type === 'profit' ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Profit
          </span>
        ) : null}
      </div>

      <div className="space-y-1">
        <p className={`text-xl sm:text-2xl font-bold font-mono ${getValueColor()}`}>
          {formattedAmount}
        </p>

        {(marginPercentage !== undefined || subtitle) && (
          <div className="flex items-center gap-2 text-xs">
            {marginPercentage !== undefined && (
              <span
                className={`font-semibold font-mono px-1.5 py-0.5 rounded text-[11px] ${
                  isLoss
                    ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                    : 'bg-neutral-100 dark:bg-[#1A1A1A] text-[#111111] dark:text-[#FAFAFA]'
                }`}
              >
                {marginPercentage.toFixed(1)}% margin
              </span>
            )}
            {subtitle && (
              <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
