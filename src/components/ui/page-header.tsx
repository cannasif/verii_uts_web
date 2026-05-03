import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';

interface PageHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function PageHeader({ title, description, action, titleClassName, descriptionClassName }: PageHeaderProps) {
  const theme = useUiStore((state) => state.theme);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <h1
          className={cn(
            theme === 'light'
              ? 'text-[#2A2C31] text-xl font-semibold sm:text-2xl'
              : 'bg-linear-to-r from-[#ff8bc7] via-[#ff9f9f] to-[#ffb16b] bg-clip-text text-xl font-semibold text-transparent drop-shadow-[0_0_16px_rgba(255,96,135,0.22)] sm:text-2xl',
            'font-plus-jakarta',
            titleClassName,
          )}
        >
          {title}
        </h1>
        <p
          className={cn(
            theme === 'light'
              ? 'page-subtitle mt-1 text-sm text-slate-600'
              : 'page-subtitle mt-1 text-sm text-white',
            descriptionClassName,
          )}
        >
          {description}
        </p>
      </div>
      {action ? <div className="w-full lg:w-auto">{action}</div> : null}
    </div>
  );
}
