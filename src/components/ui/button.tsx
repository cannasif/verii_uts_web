import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        primary: 'cyber-btn-primary bg-linear-to-r from-[#ff2f92] via-[#ff5a63] to-[#ff8a2f] text-white shadow-[0_10px_24px_rgba(255,95,119,0.28)] hover:translate-y-[-1px] hover:from-[#ff3a9a] hover:via-[#ff6a5b] hover:to-[#ff9a36]',
        secondary: 'cyber-btn-secondary bg-[#1a1129]/78 text-sky-100 ring-1 ring-white/12 hover:bg-[#23163a]',
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
        theme === 'dark' && variant === 'primary' && 'bg-white/10 border border-white/10 text-white shadow-[0_12px_28px_rgba(0,0,0,0.22)] hover:bg-white/15 hover:translate-y-0',
        theme === 'dark' && variant === 'secondary' && 'bg-white/5 border border-white/10 text-slate-100 shadow-[0_6px_20px_rgba(0,0,0,0.16)] hover:bg-white/10',
        theme === 'dark' && variant === 'ghost' && 'bg-white/5 text-slate-100 border border-white/10 hover:bg-white/10',
        theme === 'light' && variant === 'primary' && 'bg-linear-to-r from-[#7C3AED] to-[#5B21B6] shadow-[0_12px_28px_rgba(124,58,237,0.16)]',
        theme === 'light' && variant === 'secondary' && 'bg-white/75 text-[#2A2C31] ring-1 ring-inset ring-purple-200/60 hover:bg-white',
        theme === 'light' && variant === 'ghost' && 'text-[#2A2C31] hover:bg-purple-50/70',
        className,
      )}
      {...props}
    />
  );
}
