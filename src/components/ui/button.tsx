import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        primary: 'bg-linear-to-r from-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-200 hover:translate-y-[-1px]',
        secondary: 'bg-white/80 text-slate-700 ring-1 ring-slate-200 hover:bg-white',
        ghost: 'text-slate-600 hover:bg-slate-100',
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
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
