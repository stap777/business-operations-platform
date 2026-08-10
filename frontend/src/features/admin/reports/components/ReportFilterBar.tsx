import React, { useState } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

export type DatePreset = 'TODAY' | '7_DAYS' | '30_DAYS' | 'CUSTOM';

interface ReportFilterBarProps {
  onDateChange: (startDate?: string, endDate?: string) => void;
  granularity?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  onGranularityChange?: (granularity: 'DAILY' | 'WEEKLY' | 'MONTHLY') => void;
  onRefresh: () => void;
  isFetching: boolean;
  showGranularity?: boolean;
}

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
  onDateChange,
  granularity = 'DAILY',
  onGranularityChange,
  onRefresh,
  isFetching,
  showGranularity = false,
}) => {
  const [activePreset, setActivePreset] = useState<DatePreset>('30_DAYS');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const formatDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handlePresetSelect = (preset: DatePreset) => {
    setActivePreset(preset);
    const today = new Date();

    if (preset === 'TODAY') {
      const todayStr = formatDateString(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
      onDateChange(todayStr, todayStr);
    } else if (preset === '7_DAYS') {
      const past7 = new Date();
      past7.setDate(today.getDate() - 7);
      const startStr = formatDateString(past7);
      const endStr = formatDateString(today);
      setStartDate(startStr);
      setEndDate(endStr);
      onDateChange(startStr, endStr);
    } else if (preset === '30_DAYS') {
      const past30 = new Date();
      past30.setDate(today.getDate() - 30);
      const startStr = formatDateString(past30);
      const endStr = formatDateString(today);
      setStartDate(startStr);
      setEndDate(endStr);
      onDateChange(startStr, endStr);
    } else if (preset === 'CUSTOM') {
      // Keep custom input values
      onDateChange(startDate || undefined, endDate || undefined);
    }
  };

  const handleCustomDateApply = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setActivePreset('CUSTOM');
    onDateChange(start || undefined, end || undefined);
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] p-3 rounded-xl shadow-2xs">
      {/* Date Range Presets */}
      <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
        <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium mr-1 shrink-0 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" /> Date:
        </span>
        {(['TODAY', '7_DAYS', '30_DAYS', 'CUSTOM'] as DatePreset[]).map((preset) => {
          const labels: Record<DatePreset, string> = {
            TODAY: 'Today',
            '7_DAYS': '7 Days',
            '30_DAYS': '30 Days',
            CUSTOM: 'Custom',
          };
          const isActive = activePreset === preset;

          return (
            <button
              key={preset}
              onClick={() => handlePresetSelect(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                isActive
                  ? 'bg-[#111111] text-white dark:bg-[#FAFAFA] dark:text-[#111111]'
                  : 'bg-[#FAFAFA] dark:bg-[#151515] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] border border-[#ECECEC] dark:border-[#232323]'
              }`}
            >
              {labels[preset]}
            </button>
          );
        })}
      </div>

      {/* Custom Range & Controls */}
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
        {activePreset === 'CUSTOM' && (
          <div className="flex items-center gap-1 text-xs text-[#71717A] dark:text-[#A1A1AA]">
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleCustomDateApply(e.target.value, endDate)}
              className="p-1.5 text-xs bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA]"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleCustomDateApply(startDate, e.target.value)}
              className="p-1.5 text-xs bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA]"
            />
          </div>
        )}

        {showGranularity && onGranularityChange && (
          <select
            value={granularity}
            onChange={(e) => onGranularityChange(e.target.value as any)}
            className="h-8 px-2.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] text-xs text-[#111111] dark:text-[#FAFAFA] focus:outline-none cursor-pointer"
          >
            <option value="DAILY">Daily Breakdown</option>
            <option value="WEEKLY">Weekly Breakdown</option>
            <option value="MONTHLY">Monthly Breakdown</option>
          </select>
        )}

        {/* Refresh Action */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isFetching}
          className="h-8 text-xs border-[#ECECEC] dark:border-[#232323] text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA] gap-1"
          title="Refresh Report Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
};
