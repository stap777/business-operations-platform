import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);

      // Auto-focus first input field
      const timer = setTimeout(() => {
        const focusable = document.querySelector<HTMLElement>(
          '.fixed.inset-0 input:not([disabled]):not([type="hidden"]), .fixed.inset-0 select:not([disabled]), .fixed.inset-0 textarea:not([disabled])'
        );
        if (focusable) {
          focusable.focus();
        }
      }, 50);

      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '4xl': 'sm:max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidthClasses[maxWidth]} bg-white dark:bg-[#0F0F0F] border-t sm:border border-[#ECECEC] dark:border-[#232323] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECECEC] dark:border-[#232323] shrink-0 bg-[#FAFAFA]/50 dark:bg-[#151515]/50">
            <div>
              <h3 className="text-base font-semibold text-[#111111] dark:text-[#FAFAFA]">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-[#F4F4F5] dark:hover:bg-[#232323] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-6 py-3.5 border-t border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA]/80 dark:bg-[#151515]/80 backdrop-blur-xs shrink-0 flex items-center justify-between gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
