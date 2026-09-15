import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Quiet tertiary action (e.g. Manage billing →) */
  action?: ReactNode;
  trailing?: ReactNode;
  className?: string;
};

/** DubClub-style page header: strong H1 + support text + quiet tertiary action. Prizelet tokens only. */
export function PageHeader({ title, description, action, trailing, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-heading font-bold text-foreground">{title}</h1>
          {action}
        </div>
        {description ? (
          <p className="mt-0.5 text-support text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {trailing ? <div className="flex shrink-0 flex-wrap items-center gap-2">{trailing}</div> : null}
    </header>
  );
}
