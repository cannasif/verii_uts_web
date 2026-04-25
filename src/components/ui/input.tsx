import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'cyber-input h-12 w-full rounded-2xl border border-white/12 bg-[#120b1f]/72 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20',
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
