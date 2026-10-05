import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Admin page toolbar — actions only.
 * Page title lives in AdminTopBar / MobileTopBar; no duplicate H1 or subtitle.
 */
export function AdminPageHeader({
  actions,
  notice,
  className,
}: {
  /** @deprecated Unused — title is shown in the top bar. */
  title?: string;
  /** @deprecated Unused — avoid in-page marketing/count subtitles. */
  description?: ReactNode;
  /** @deprecated Unused. */
  eyebrow?: string;
  actions?: ReactNode;
  /** Optional compact warning (e.g. scan truncation). */
  notice?: ReactNode;
  className?: string;
}) {
  if (!actions && !notice) return null;

  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-3 sm:mb-8',
        actions ? 'sm:flex-row sm:items-start sm:justify-end' : null,
        className,
      )}
    >
      {notice ? (
        <div className="min-w-0 flex-1 text-caption text-amber-600 dark:text-amber-400">
          {notice}
        </div>
      ) : null}
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

/** Clay content shell used across admin list/chart/form sections. */
export const adminClayCard = 'clay-card p-4 sm:p-6';

export const adminSectionTitle =
  'text-base font-extrabold tracking-tight text-foreground';
