import { useId } from 'react';
import { Check, Circle, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Doc } from '../../../convex/_generated/dataModel';
import { clayCard } from '@/lib/overviewClay';
import { cn } from '@/lib/utils';

type Props = {
  creator: Pick<Doc<'creators'>, 'verificationStatus' | 'stripeAccountId' | 'stripeConnectPayoutsEnabled' | 'stripeConnectDetailsSubmitted' | 'isPublished'>;
  user: Pick<Doc<'users'>, 'email' | 'emailVerificationTime'> | null;
};

export function CreatorAccountStatus({ creator, user }: Props) {
  const headingId = useId();
  const emailVerified = Boolean(user?.email?.trim()) && typeof user?.emailVerificationTime === 'number';
  const creatorVerified = creator.verificationStatus === 'verified';
  const creatorPending = creator.verificationStatus === 'pending';
  // A connected account or charge permission alone does not establish payout readiness.
  const payoutsEnabled = Boolean(creator.stripeAccountId) && creator.stripeConnectPayoutsEnabled === true;
  const payoutStatus = !creator.stripeAccountId
    ? 'Not connected'
    : payoutsEnabled
      ? 'Enabled'
      : creator.stripeConnectDetailsSubmitted === true
        ? 'Not enabled'
        : 'Setup incomplete';
  const rows = [
    { label: 'Email verification', value: !user ? 'Unavailable' : emailVerified ? 'Verified' : 'Not verified', complete: emailVerified },
    { label: 'Creator verification', value: creatorVerified ? 'Verified' : creatorPending ? 'Pending' : 'Not verified', complete: creatorVerified, pending: creatorPending },
    { label: 'Payouts', value: payoutStatus, complete: payoutsEnabled },
    { label: 'Public profile', value: creator.isPublished ? 'Published' : 'Unpublished', complete: creator.isPublished },
  ];

  return (
    <section aria-labelledby={headingId} className={cn(clayCard, 'space-y-3 p-5 sm:p-6')}>
      <h2 id={headingId} className="text-base font-extrabold tracking-tight text-foreground">Account Status</h2>
      <p className="text-sm text-muted-foreground">Verification, payout setup, and profile visibility for your account.</p>
      <dl className="space-y-3">
        {rows.map(({ label, value, complete, pending }) => {
          const Icon = complete ? Check : pending ? Clock3 : Circle;
          return (
            <div key={label} className="text-sm">
              <dt className="flex items-center gap-2.5 font-medium text-foreground">
                <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full', complete
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                  : pending ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' : 'bg-muted text-muted-foreground')}>
                  <Icon className="h-3 w-3" aria-hidden />
                </span>
                {label}
              </dt>
              <dd className="pl-[1.875rem] text-muted-foreground">{value}</dd>
            </div>
          );
        })}
      </dl>
      <Link to="/creator/payouts" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4">Manage payouts</Link>
    </section>
  );
}
