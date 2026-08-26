
export interface SegmentedControlOption<T extends string = string> {
  label: string;
  value: T;
  count?: number;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className = '',
  size = 'md',
}: SegmentedControlProps<T>) {
  const isSm = size === 'sm';

  return (
    <div
      className={`inline-flex items-center bg-[#F4F4F5] dark:bg-[#1C1C1E] p-1 rounded-xl border border-[#E4E4E7]/60 dark:border-[#27272A]/60 ${className}`}
      role="tablist"
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={`relative flex items-center justify-center gap-1.5 font-medium transition-all duration-200 select-none ${
              isSm ? 'px-2.5 py-1 text-xs rounded-lg' : 'px-3.5 py-1.5 text-xs rounded-lg'
            } ${
              isActive
                ? 'bg-white dark:bg-[#27272A] text-[#09090B] dark:text-[#FAFAFA] shadow-xs shadow-black/5 font-semibold'
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-[#FAFAFA]'
            }`}
          >
            <span>{option.label}</span>
            {typeof option.count === 'number' && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                  isActive
                    ? 'bg-[#F4F4F5] dark:bg-[#18181B] text-[#09090B] dark:text-[#FAFAFA]'
                    : 'bg-black/5 dark:bg-white/5 text-[#71717A] dark:text-[#A1A1AA]'
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
