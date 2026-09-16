/**
 * Sample Referrals data for design review when the creator has no attributed signups yet.
 */

const day = 86_400_000;
const daysAgo = (n: number) => Date.now() - n * day;

export type DemoReferralRow = {
  id: string;
  referred_email: string | null;
  converted: boolean;
  created_at: string;
};

export const CREATOR_REFERRALS_DEMO_ROWS: DemoReferralRow[] = [
  {
    id: 'demo-ref-1',
    referred_email: 'jordan@example.com',
    converted: true,
    created_at: new Date(daysAgo(2)).toISOString(),
  },
  {
    id: 'demo-ref-2',
    referred_email: 'sam.lee@example.com',
    converted: true,
    created_at: new Date(daysAgo(5)).toISOString(),
  },
  {
    id: 'demo-ref-3',
    referred_email: 'maya.o@example.com',
    converted: false,
    created_at: new Date(daysAgo(8)).toISOString(),
  },
  {
    id: 'demo-ref-4',
    referred_email: null,
    converted: false,
    created_at: new Date(daysAgo(12)).toISOString(),
  },
];

export function shouldUseCreatorReferralsDemo(opts: {
  count: number;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (opts.disableDemo) return false;
  if (opts.forceDemo) return true;
  return opts.count === 0;
}
