import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Shared in-page header for admin dashboards (matches Creator Overview language). */
export function AdminPageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-caption font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={cn(
            'type-page-title text-foreground md:text-[2.25rem] md:leading-[1.15]',
            eyebrow ? 'mt-1' : null,
          )}
        >
          {title}
        </h1>
        {description ? (
          <div className="mt-1.5 text-sm text-muted-foreground">{description}</div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Clay content shell used across admin list/chart/form sections. */
export const adminClayCard = 'clay-card p-4 sm:p-6';

export const adminSectionTitle =
  'text-base font-extrabold tracking-tight text-foreground';
