import { Link } from 'react-router-dom';
import { Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function OverviewReferralBanner() {
  return (
    <section
      className={cn(
        'flex flex-col gap-4 rounded-[var(--radius-clay)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6',
        /* Light: solid primary clay */
        'bg-primary text-primary-foreground',
        'shadow-[0_8px_20px_rgba(66,159,240,0.22),inset_0_-3px_8px_rgba(8,24,47,0.1),inset_0_3px_8px_rgba(255,255,255,0.15)]',
        /* Dark: deep navy panel + soft primary border (not neon fill) */
        'dark:border dark:border-primary/30 dark:bg-[var(--active-bg)] dark:text-foreground',
        'dark:shadow-[0_8px_20px_rgba(0,0,0,0.35),inset_0_-3px_8px_rgba(0,0,0,0.28),inset_0_3px_8px_rgba(255,255,255,0.04)]',
      )}
    >
      <div className="flex min-w-0 items-start gap-3 sm:items-center">
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            'bg-white/20 shadow-[inset_0_-1px_3px_rgba(8,24,47,0.1),inset_0_1px_3px_rgba(255,255,255,0.25)]',
            'dark:bg-primary/20 dark:text-primary dark:shadow-[inset_0_-1px_3px_rgba(0,0,0,0.3),inset_0_1px_3px_rgba(255,255,255,0.06)]',
          )}
        >
          <Gift className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-base font-extrabold tracking-tight sm:text-lg">
            Refer a creator, earn rewards!
          </p>
          <p className="mt-0.5 text-sm font-medium text-primary-foreground/85 dark:text-muted-foreground">
            Share Sweeph with fellow creators and earn when they get paid.
          </p>
        </div>
      </div>
      <Button
        asChild
        variant="secondary"
        size="sm"
        className={cn(
          'clay-btn h-11 w-full shrink-0 rounded-[0.875rem] px-5 font-semibold sm:w-auto',
          'bg-white text-primary hover:bg-white/90',
          'dark:bg-primary dark:text-[#061426] dark:hover:bg-primary/90',
        )}
      >
        <Link to="/creator/referrals">Get Your Referral Link</Link>
      </Button>
    </section>
  );
}
