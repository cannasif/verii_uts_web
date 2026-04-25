import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const theme = useUiStore((state) => state.theme);

  return (
    <div
      className={cn(
        theme === 'light'
          ? 'rounded-[24px] border border-transparent bg-white/66 shadow-[0_10px_28px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-2xl'
          : 'cyber-card rounded-[28px] border border-fuchsia-400/35 bg-[#1b1230]/82 shadow-[0_22px_72px_rgba(3,5,17,0.55),inset_0_0_24px_rgba(56,189,248,0.1),inset_0_0_30px_rgba(244,114,182,0.08)] backdrop-blur-xl',
        className,
      )}
      {...props}
    />
  );
}
