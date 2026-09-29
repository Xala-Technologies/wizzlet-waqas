import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type LandingSectionHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
  action?: ReactNode;
};

/**
 * Shared marketing section header — matches Discover / home hero typography.
 */
export function LandingSectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
  action,
}: LandingSectionHeaderProps) {
  const centered = align === 'center';

  return (
    <div
      className={cn(
        'mb-10 md:mb-12',
        centered ? 'mx-auto max-w-2xl text-center' : 'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className={cn(centered ? '' : 'min-w-0 max-w-2xl')}>
        {eyebrow ? (
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.32em] text-[#429FF0]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-[2rem] font-extrabold leading-[1.08] tracking-[-0.045em] text-foreground sm:text-4xl lg:text-[2.75rem]">
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              'mt-4 text-lg leading-relaxed text-muted-foreground',
              centered ? 'mx-auto max-w-lg' : 'max-w-md',
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action && !centered ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Soft white card shell used across home sections. */
export const landingCardClass =
  'rounded-3xl border border-border bg-white shadow-[0_8px_28px_rgba(8,24,47,0.06)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#429FF0]/25 hover:shadow-[0_16px_40px_rgba(8,24,47,0.1)] dark:bg-card';

export const landingIconChipClass =
  'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E1F2FF] text-[#429FF0]';
