import { Link } from 'react-router-dom';
import { Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OverviewReferralBanner() {
  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-primary px-5 py-5 text-primary-foreground shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-start gap-3 sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <Gift className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-base font-extrabold tracking-tight sm:text-lg">
            Refer a creator, earn rewards!
          </p>
          <p className="mt-0.5 text-sm font-medium text-primary-foreground/85">
            Share Prizelet with fellow creators and earn when they get paid.
          </p>
        </div>
      </div>
      <Button
        asChild
        variant="secondary"
        className="h-11 w-full shrink-0 rounded-xl bg-white px-5 font-semibold text-primary hover:bg-white/90 sm:w-auto"
      >
        <Link to="/creator/referrals">Get Your Referral Link</Link>
      </Button>
    </section>
  );
}
