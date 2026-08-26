import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface ActionDropdownMenuProps {
  items: ActionMenuItem[];
  align?: 'right' | 'left';
}

export const ActionDropdownMenu: React.FC<ActionDropdownMenuProps> = ({
  items,
  align = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-1.5 rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] hover:bg-[#F4F4F5] dark:hover:bg-[#232323] transition-colors focus:outline-none cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
        aria-label="Actions menu"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-1 w-44 rounded-xl bg-white dark:bg-[#0F0F0F] p-1.5 shadow-xl border border-[#ECECEC] dark:border-[#232323] z-50 animate-in fade-in zoom-in-95 duration-100`}
        >
          <div className="space-y-0.5">
            {items.map((item, index) => {
              const Icon = item.icon;
              const isDanger = item.variant === 'danger';

              return (
                <button
                  key={index}
                  disabled={item.disabled}
                  onClick={() => {
                    setIsOpen(false);
                    item.onClick();
                  }}
                  className={`w-full text-left px-2.5 py-2 text-xs font-medium rounded-lg flex items-center gap-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer ${
                    isDanger
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50'
                      : 'text-[#111111] dark:text-[#FAFAFA] hover:bg-[#F4F4F5] dark:hover:bg-[#1C1C1E]'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 shrink-0 opacity-80" />}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
