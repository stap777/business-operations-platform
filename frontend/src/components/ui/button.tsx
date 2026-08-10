import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-150 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111] dark:focus-visible:ring-[#FAFAFA] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:translate-y-0',
  {
    variants: {
      variant: {
        default:
          'bg-[#000000] text-[#FFFFFF] hover:bg-[#18181B] dark:bg-[#FFFFFF] dark:text-[#000000] dark:hover:bg-[#F4F4F5]',
        primary:
          'bg-[#000000] text-[#FFFFFF] hover:bg-[#18181B] dark:bg-[#FFFFFF] dark:text-[#000000] dark:hover:bg-[#F4F4F5]',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 dark:bg-red-900 dark:text-white dark:hover:bg-red-800',
        outline:
          'border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] text-[#111111] dark:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#18181B]',
        secondary:
          'border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] text-[#111111] dark:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#18181B]',
        ghost:
          'hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] text-[#111111] dark:text-[#FAFAFA]',
        link: 'text-[#111111] dark:text-[#FAFAFA] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-12 px-4 py-2 text-sm',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-xl px-6 text-sm font-medium',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'ref'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <motion.button
        whileTap={{ scale: 0.98 }}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
