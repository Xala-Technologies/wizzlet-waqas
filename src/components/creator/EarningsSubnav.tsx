import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'overview', label: 'Overview', href: '/creator/earnings' },
  { id: 'payouts', label: 'Payouts', href: '/creator/payouts' },
  { id: 'transactions', label: 'Transactions', href: '/creator/transactions' },
  { id: 'tax', label: 'Tax Documents', href: '/creator/earnings#tax-docs' },
] as const;

export type EarningsTabId = (typeof TABS)[number]['id'];

export function EarningsSubnav({ active }: { active?: EarningsTabId }) {
  const { pathname, hash } = useLocation();
  const resolved: EarningsTabId =
    active ??
    (pathname.startsWith('/creator/payouts')
      ? 'payouts'
      : pathname.startsWith('/creator/transactions')
        ? 'transactions'
        : hash === '#tax-docs'
          ? 'tax'
          : 'overview');

  return (
    <nav
      className="mb-6 flex gap-1 overflow-x-auto border-b border-border"
      aria-label="Earnings sections"
    >
      {TABS.map((tab) => {
        const isActive = resolved === tab.id;
        return (
          <Link
            key={tab.id}
            to={tab.href}
            className={cn(
              'shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors',
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
