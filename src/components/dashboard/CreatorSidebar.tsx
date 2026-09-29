import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { SweephLogo } from '@/components/SweephLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { dashboardSidebarAsideClassName } from '@/lib/dashboardSidebar';
import {
  Home,
  PenLine,
  Package,
  Users,
  Megaphone,
  MessageSquare,
  Link2,
  UserPlus,
  TrendingUp,
  DollarSign,
  Wallet,
  CreditCard,
  FileWarning,
  Settings,
  ChevronDown,
  Brain,
  HelpCircle,
  Percent,
  LogOut,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { RoleSwitcher } from './RoleSwitcher';
import { api } from '@convex/_generated/api';
import { cn } from '@/lib/utils';
import { useDocumentDark } from '@/hooks/useDocumentDark';
import {
  SIDEBAR_BADGE_CLASS,
  sidebarChildDotClass,
  sidebarChildLinkClass,
  sidebarFooterGhostClass,
  sidebarNavIconClass,
  sidebarNavItemClass,
} from '@/lib/sidebarNav';

interface NavItem {
  label: string;
  href: string;
  icon: typeof Home;
  badge?: string;
  chevron?: boolean;
}

/** Primary mockup nav order — matches PO Overview chrome. */
const primaryItems: NavItem[] = [
  { label: 'Overview', href: '/creator', icon: Home },
  { label: 'Posts', href: '/creator/posts', icon: PenLine },
  { label: 'Products', href: '/creator/products', icon: Package },
  { label: 'Subscribers', href: '/creator/subscribers', icon: Users },
  { label: 'Performance', href: '/creator/performance-tracker', icon: TrendingUp },
  { label: 'Messages', href: '/creator/messages', icon: MessageSquare },
  { label: 'Marketing', href: '/creator/promo', icon: Megaphone, chevron: true },
  { label: 'Finance', href: '/creator/earnings', icon: DollarSign, chevron: true },
  { label: 'Settings', href: '/creator/settings', icon: Settings, chevron: true },
  { label: 'Growth Manager', href: '/creator/personal-growth-manager', icon: Brain },
];

const marketingChildItems: NavItem[] = [
  { label: 'Overview', href: '/creator/promo', icon: Megaphone },
  { label: 'Promo Codes', href: '/creator/promo/codes', icon: Percent },
  { label: 'Links', href: '/creator/links', icon: Link2 },
  { label: 'Referrals', href: '/creator/referrals', icon: UserPlus },
];

const earningsChildItems: NavItem[] = [
  { label: 'Overview', href: '/creator/earnings', icon: DollarSign },
  { label: 'Payouts', href: '/creator/payouts', icon: Wallet },
  { label: 'Transactions', href: '/creator/transactions', icon: CreditCard },
  { label: 'Tax Documents', href: '/creator/earnings#tax-docs', icon: FileWarning },
  { label: 'Resolution Case', href: '/creator/resolution-case', icon: FileWarning },
];

const settingsChildItems: NavItem[] = [
  { label: 'General', href: '/creator/settings', icon: Settings },
  { label: 'Branding', href: '/creator/settings?tab=branding', icon: Settings },
  { label: 'Team', href: '/creator/settings?tab=team', icon: Users },
  { label: 'Billing', href: '/creator/settings?tab=billing', icon: Wallet },
  { label: 'Integrations', href: '/creator/settings?tab=integrations', icon: Link2 },
  { label: 'Notifications', href: '/creator/settings?tab=notifications', icon: HelpCircle },
  { label: 'Security', href: '/creator/settings?tab=security', icon: Settings },
  { label: 'Advanced', href: '/creator/settings?tab=advanced', icon: Settings },
];

/** Access Control + Smart Pricing live under Products; Notifications via top-bar bell. */

function isMarketingPath(pathname: string): boolean {
  return (
    pathname === '/creator/promo' ||
    pathname.startsWith('/creator/promo/codes') ||
    pathname.startsWith('/creator/links') ||
    pathname.startsWith('/creator/referrals')
  );
}

function isMarketingChildActive(pathname: string, href: string): boolean {
  if (href === '/creator/promo') {
    return pathname === '/creator/promo';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isEarningsPath(pathname: string): boolean {
  return (
    pathname === '/creator/earnings' ||
    pathname.startsWith('/creator/earnings/') ||
    pathname.startsWith('/creator/payouts') ||
    pathname.startsWith('/creator/transactions') ||
    pathname.startsWith('/creator/resolution-case')
  );
}

function isEarningsChildActive(pathname: string, href: string, hash: string): boolean {
  if (href === '/creator/earnings#tax-docs') {
    return pathname === '/creator/earnings' && hash === '#tax-docs';
  }
  if (href === '/creator/earnings') {
    return pathname === '/creator/earnings' && hash !== '#tax-docs';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isSettingsPath(pathname: string): boolean {
  return pathname === '/creator/settings' || pathname.startsWith('/creator/settings/');
}

function settingsTabFromHref(href: string): string | null {
  try {
    const q = href.includes('?') ? href.slice(href.indexOf('?') + 1) : '';
    return new URLSearchParams(q).get('tab');
  } catch {
    return null;
  }
}

function isSettingsChildActive(pathname: string, search: string, href: string): boolean {
  if (!isSettingsPath(pathname)) return false;
  const currentTab = new URLSearchParams(search).get('tab');
  const targetTab = settingsTabFromHref(href);
  if (!targetTab) {
    return !currentTab || currentTab === 'general';
  }
  return currentTab === targetTab;
}

function formatBadge(n: number): string | undefined {
  if (n <= 0) return undefined;
  return n > 9 ? '9+' : String(n);
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === '/creator') return pathname === '/creator';
  if (href === '/creator/products') {
    return (
      pathname === href ||
      pathname.startsWith(`${href}/`) ||
      pathname.startsWith('/creator/access-control') ||
      pathname.startsWith('/creator/smart-pricing')
    );
  }
  if (href === '/creator/promo') {
    return (
      pathname === href ||
      pathname.startsWith('/creator/promo/codes') ||
      pathname.startsWith(`${href}/`) ||
      pathname.startsWith('/creator/links') ||
      pathname.startsWith('/creator/referrals')
    );
  }
  if (href === '/creator/earnings') {
    return (
      pathname === href ||
      pathname.startsWith(`${href}/`) ||
      pathname.startsWith('/creator/payouts') ||
      pathname.startsWith('/creator/transactions') ||
      pathname.startsWith('/creator/resolution-case')
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItemLink({
  item,
  active,
  dark,
}: {
  item: NavItem;
  active: boolean;
  dark: boolean;
}) {
  return (
    <Link to={item.href} className={sidebarNavItemClass(active, dark)}>
      <item.icon className={sidebarNavIconClass(active, dark)} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge ? <span className={SIDEBAR_BADGE_CLASS}>{item.badge}</span> : null}
    </Link>
  );
}

function ExpandableNavSection({
  item,
  active,
  dark,
  open,
  onOpenChange,
  children,
}: {
  item: NavItem;
  active: boolean;
  dark: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className={cn(sidebarNavItemClass(active, dark), 'w-full text-left')}
      >
        <item.icon className={sidebarNavIconClass(active, dark)} />
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge ? <span className={SIDEBAR_BADGE_CLASS}>{item.badge}</span> : null}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-transform duration-150',
            open ? 'rotate-0' : '-rotate-90',
            dark
              ? active
                ? 'text-[var(--active-text)]'
                : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
              : 'text-muted-foreground',
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          className={cn(
            'ml-4 space-y-0.5 border-l pl-2',
            dark ? 'border-[var(--border-subtle)]' : 'border-border',
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function ChildNavLink({
  href,
  label,
  active,
  dark,
  badge,
}: {
  href: string;
  label: string;
  active: boolean;
  dark: boolean;
  badge?: string;
}) {
  return (
    <Link to={href} className={sidebarChildLinkClass(active, dark)}>
      <span className={sidebarChildDotClass(active)} aria-hidden />
      <span className="flex-1 truncate">{label}</span>
      {badge ? <span className={SIDEBAR_BADGE_CLASS}>{badge}</span> : null}
    </Link>
  );
}

function useSectionOpen(routeActive: boolean) {
  const [open, setOpen] = useState(routeActive);
  useEffect(() => {
    if (routeActive) setOpen(true);
  }, [routeActive]);
  return [open, setOpen] as const;
}

export function CreatorSidebar({ mobile = false }: { mobile?: boolean } = {}) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const hash = location.hash;
  const search = location.search;
  const dark = useDocumentDark();

  const handleSignOut = async () => {
    navigate('/');
    await signOut();
  };

  const dmUnread = useQuery(api.messaging.mutations.unreadCountCreator, user ? {} : 'skip');
  const growthUnread = useQuery(
    api.support.mutations.unreadCountCreatorGrowth,
    user ? {} : 'skip',
  );
  const resolutionUnread = useQuery(
    api.resolution.mutations.unreadCountCreator,
    user ? {} : 'skip',
  );

  const marketingActive = isMarketingPath(pathname);
  const earningsActive = isEarningsPath(pathname);
  const settingsActive = isSettingsPath(pathname);
  const [marketingOpen, setMarketingOpen] = useSectionOpen(marketingActive);
  const [earningsOpen, setEarningsOpen] = useSectionOpen(earningsActive);
  const [settingsOpen, setSettingsOpen] = useSectionOpen(settingsActive);

  const withBadges = (item: NavItem): NavItem => {
    if (item.href === '/creator/messages') {
      const badge = formatBadge(dmUnread ?? 0);
      return badge ? { ...item, badge } : item;
    }
    if (item.href === '/creator/personal-growth-manager') {
      const badge = formatBadge(growthUnread ?? 0);
      return badge ? { ...item, badge } : item;
    }
    return item;
  };

  return (
    <aside className={dashboardSidebarAsideClassName(mobile, undefined, dark ? 'dark' : 'light')}>
      {!mobile && (
        <div
          className={cn(
            'border-b px-5 pb-5 pt-6',
            dark ? 'border-[var(--border-subtle)]' : 'border-border',
          )}
        >
          <SweephLogo
            size="sidebar"
            linkTo="/creator"
            variant={dark ? 'dark' : 'light'}
          />
        </div>
      )}

      <nav className={cn('flex-1 space-y-1 overflow-y-auto px-3 pb-4', mobile && 'pt-4')}>
        {primaryItems.map((item) => {
          if (item.href === '/creator/promo') {
            return (
              <ExpandableNavSection
                key={item.href}
                item={withBadges(item)}
                active={marketingActive}
                dark={dark}
                open={marketingOpen}
                onOpenChange={setMarketingOpen}
              >
                {marketingChildItems.map((child) => (
                  <ChildNavLink
                    key={child.href}
                    href={child.href}
                    label={child.label}
                    active={isMarketingChildActive(pathname, child.href)}
                    dark={dark}
                  />
                ))}
              </ExpandableNavSection>
            );
          }

          if (item.href === '/creator/earnings') {
            return (
              <ExpandableNavSection
                key={item.href}
                item={withBadges(item)}
                active={earningsActive}
                dark={dark}
                open={earningsOpen}
                onOpenChange={setEarningsOpen}
              >
                {earningsChildItems.map((child) => (
                  <ChildNavLink
                    key={child.href}
                    href={child.href}
                    label={child.label}
                    active={isEarningsChildActive(pathname, child.href, hash)}
                    dark={dark}
                    badge={
                      child.href === '/creator/resolution-case'
                        ? formatBadge(resolutionUnread ?? 0)
                        : undefined
                    }
                  />
                ))}
              </ExpandableNavSection>
            );
          }

          if (item.href === '/creator/settings') {
            return (
              <ExpandableNavSection
                key={item.href}
                item={withBadges(item)}
                active={settingsActive}
                dark={dark}
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
              >
                {settingsChildItems.map((child) => (
                  <ChildNavLink
                    key={child.href}
                    href={child.href}
                    label={child.label}
                    active={isSettingsChildActive(pathname, search, child.href)}
                    dark={dark}
                  />
                ))}
              </ExpandableNavSection>
            );
          }

          return (
            <NavItemLink
              key={item.href}
              item={withBadges(item)}
              active={isActivePath(pathname, item.href)}
              dark={dark}
            />
          );
        })}
      </nav>

      <div
        className={cn(
          'shrink-0 space-y-2 px-3 py-4',
          dark ? 'border-t border-[var(--border-subtle)]' : 'border-t border-border',
        )}
      >
        {!mobile && <RoleSwitcher tone={dark ? 'dark' : 'light'} />}

        {mobile ? (
          <>
            <Button variant="ghost" size="sm" className={sidebarFooterGhostClass(dark)} asChild>
              <Link to="/support">
                <HelpCircle className="h-4 w-4" />
                Help & Support
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={sidebarFooterGhostClass(dark)}
              onClick={() => void handleSignOut()}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </>
        ) : null}
      </div>
    </aside>
  );
}
