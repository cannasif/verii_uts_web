import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-60 hover:brightness-105',
  {
    variants: {
      variant: {
        primary: 'cyber-btn-primary bg-linear-to-r from-[#ff3a9b] via-[#ff6282] to-[#ff9b45] text-white shadow-[0_8px_18px_rgba(255,95,119,0.18)] hover:translate-y-[-1px] hover:from-[#ff4aa4] hover:via-[#ff6d84] hover:to-[#ffad55]',
        secondary: 'cyber-btn-secondary border border-white/10 bg-[#1a1129]/70 text-sky-100 hover:bg-[#23163a]/90',
        ghost: 'cyber-btn-ghost text-sky-100 hover:bg-white/8',
        danger: 'bg-rose-500 text-white hover:bg-rose-600',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, ...props }: ButtonProps) {
  const theme = useUiStore((state) => state.theme);

  return (
    <button
      className={cn(
        buttonVariants({ variant }),
        theme === 'dark' && 'backdrop-blur-sm',
        theme === 'dark' && variant === 'primary' && 'border border-white/10 bg-white/10 text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)] hover:bg-white/15 hover:translate-y-0',
        theme === 'dark' && variant === 'secondary' && 'text-slate-100 shadow-[0_6px_16px_rgba(0,0,0,0.12)]',
        theme === 'dark' && variant === 'ghost' && 'bg-white/5 text-slate-100 border border-white/10 hover:bg-white/10',
        theme === 'light' && variant === 'primary' && 'bg-linear-to-r from-[#ff3a9b] via-[#ff5f40] to-[#ff9f2a] shadow-[0_10px_22px_rgba(255,90,99,0.16)]',
        theme === 'light' && variant === 'secondary' && 'bg-white/72 text-[#2A2C31] border border-[rgba(255,138,196,0.24)] shadow-[0_4px_12px_rgba(15,23,42,0.04)] hover:bg-white',
        theme === 'light' && variant === 'ghost' && 'text-[#2A2C31] hover:bg-[rgba(255,90,99,0.08)]',
        className,
      )}
      {...props}
    />
  );
}
