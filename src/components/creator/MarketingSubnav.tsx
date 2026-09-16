import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'overview', label: 'Overview', href: '/creator/promo' },
  { id: 'promo-codes', label: 'Promo Codes', href: '/creator/promo/codes' },
  { id: 'links', label: 'Links', href: '/creator/links' },
  { id: 'referrals', label: 'Referrals', href: '/creator/referrals' },
] as const;

export type MarketingTabId = (typeof TABS)[number]['id'];

export function MarketingSubnav({ active }: { active?: MarketingTabId }) {
  const { pathname } = useLocation();
  const resolved: MarketingTabId =
    active ??
    (pathname.startsWith('/creator/promo/codes')
      ? 'promo-codes'
      : pathname.startsWith('/creator/links')
        ? 'links'
        : pathname.startsWith('/creator/referrals')
          ? 'referrals'
          : 'overview');

  return (
    <nav
      className="mb-6 flex gap-1 overflow-x-auto border-b border-border"
      aria-label="Marketing sections"
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
