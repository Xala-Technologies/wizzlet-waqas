import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { SweephLogo } from '@/components/SweephLogo';
import { useAuth } from '@/contexts/AuthContext';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  ChevronRight,
  Brain,
  HelpCircle,
  Ellipsis,
  Percent,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { RoleSwitcher } from './RoleSwitcher';
import { api } from '@convex/_generated/api';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  { label: 'Earnings', href: '/creator/earnings', icon: DollarSign, chevron: true },
  { label: 'Settings', href: '/creator/settings', icon: Settings, chevron: true },
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

/**
 * Secondary tools — kept out of primary nav to reduce clutter.
 * Access Control + Smart Pricing live under Products; Notifications via top-bar bell.
 * Links / Referrals live under Marketing. Payouts live under Earnings.
 */
const moreItems: NavItem[] = [
  { label: 'Growth Manager', href: '/creator/personal-growth-manager', icon: Brain },
  { label: 'Resolution Case', href: '/creator/resolution-case', icon: FileWarning },
];

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
    pathname.startsWith('/creator/transactions')
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
      pathname.startsWith('/creator/transactions')
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
      {item.chevron && !item.badge ? (
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 shrink-0',
            dark
              ? active
                ? 'text-[#25E4D2]/80'
                : 'text-[#607985] group-hover:text-[#AFC1CA]'
              : 'text-muted-foreground',
          )}
          aria-hidden
        />
      ) : null}
    </Link>
  );
}

function ChildNavLink({
  href,
  label,
  active,
  dark,
}: {
  href: string;
  label: string;
  active: boolean;
  dark: boolean;
}) {
  return (
    <Link to={href} className={sidebarChildLinkClass(active, dark)}>
      <span className={sidebarChildDotClass(active)} aria-hidden />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function CreatorSidebar({ mobile = false }: { mobile?: boolean } = {}) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const hash = location.hash;
  const search = location.search;
  const dark = !mobile;

  const handleSignOut = async () => {
    navigate('/');
    await signOut();
  };

  const creator = useQuery(api.creators.queries.myCreator, user ? {} : 'skip');
  const dmUnread = useQuery(api.messaging.mutations.unreadCountCreator, user ? {} : 'skip');
  const growthUnread = useQuery(
    api.support.mutations.unreadCountCreatorGrowth,
    user ? {} : 'skip',
  );
  const resolutionUnread = useQuery(
    api.resolution.mutations.unreadCountCreator,
    user ? {} : 'skip',
  );
  const moreHasActive = moreItems.some((i) => isActivePath(pathname, i.href));
  const [moreOpen, setMoreOpen] = useState(moreHasActive);

  const withBadges = (item: NavItem): NavItem => {
    if (item.href === '/creator/messages') {
      const badge = formatBadge(dmUnread ?? 0);
      return badge ? { ...item, badge } : item;
    }
    if (item.href === '/creator/personal-growth-manager') {
      const badge = formatBadge(growthUnread ?? 0);
      return badge ? { ...item, badge } : item;
    }
    if (item.href === '/creator/resolution-case') {
      const badge = formatBadge(resolutionUnread ?? 0);
      return badge ? { ...item, badge } : item;
    }
    return item;
  };

  const displayName =
    creator?.displayName?.trim() ||
    (creator?.username ? creator.username : user?.email?.split('@')[0] || 'Creator');
  const initial = displayName.replace(/^@/, '').charAt(0).toUpperCase() || 'C';

  return (
    <aside className={dashboardSidebarAsideClassName(mobile, undefined, dark ? 'dark' : 'light')}>
      {!mobile && (
        <div className="border-b border-[#193A47] px-5 pb-5 pt-6">
          <SweephLogo size="sidebar" linkTo="/creator" variant="dark" />
        </div>
      )}

      <nav className={cn('flex-1 space-y-1 overflow-y-auto px-3 pb-4', mobile && 'pt-4')}>
        {primaryItems.map((item) => {
          if (item.href === '/creator/promo') {
            const marketingActive = isMarketingPath(pathname);
            return (
              <div key={item.href} className="space-y-0.5">
                <NavItemLink
                  item={withBadges(item)}
                  active={marketingActive}
                  dark={dark}
                />
                {marketingActive ? (
                  <div
                    className={cn(
                      'ml-4 space-y-0.5 border-l pl-2',
                      dark ? 'border-[#193A47]' : 'border-border',
                    )}
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
                  </div>
                ) : null}
              </div>
            );
          }

          if (item.href === '/creator/earnings') {
            const earningsActive = isEarningsPath(pathname);
            return (
              <div key={item.href} className="space-y-0.5">
                <NavItemLink
                  item={withBadges(item)}
                  active={earningsActive}
                  dark={dark}
                />
                {earningsActive ? (
                  <div
                    className={cn(
                      'ml-4 space-y-0.5 border-l pl-2',
                      dark ? 'border-[#193A47]' : 'border-border',
                    )}
                  >
                    {earningsChildItems.map((child) => (
                      <ChildNavLink
                        key={child.href}
                        href={child.href}
                        label={child.label}
                        active={isEarningsChildActive(pathname, child.href, hash)}
                        dark={dark}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          }

          if (item.href === '/creator/settings') {
            const settingsActive = isSettingsPath(pathname);
            return (
              <div key={item.href} className="space-y-0.5">
                <NavItemLink
                  item={withBadges(item)}
                  active={settingsActive}
                  dark={dark}
                />
                {settingsActive ? (
                  <div
                    className={cn(
                      'ml-4 space-y-0.5 border-l pl-2',
                      dark ? 'border-[#193A47]' : 'border-border',
                    )}
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
                  </div>
                ) : null}
              </div>
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

        <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
          <CollapsibleTrigger
            className={cn(
              sidebarNavItemClass(moreHasActive, dark),
              'mt-1 w-full',
            )}
          >
            <Ellipsis className={sidebarNavIconClass(moreHasActive, dark)} />
            <span className="flex-1 truncate text-left">More</span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 shrink-0 transition-transform',
                moreOpen ? 'rotate-0' : '-rotate-90',
                dark ? 'text-[#8197A3]' : 'text-muted-foreground',
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent
            className={cn(
              'mt-1 ml-4 space-y-0.5 border-l pl-2',
              dark ? 'border-[#193A47]' : 'border-border',
            )}
          >
            {moreItems.map((item) => (
              <NavItemLink
                key={item.href}
                item={withBadges(item)}
                active={isActivePath(pathname, item.href)}
                dark={dark}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      </nav>

      <div
        className={cn(
          'shrink-0 space-y-2 px-3 py-4',
          dark ? 'border-t border-[#193A47]' : 'border-t border-border',
        )}
      >
        {!mobile && <RoleSwitcher tone={dark ? 'dark' : 'light'} />}

        {/* Identity → settings; Help / Log out only in mobile drawer (desktop uses top-bar menu) */}
        <Link
          to="/creator/settings"
          className={cn(
            'flex items-center gap-3 rounded-[var(--radius-md)] px-2.5 py-2.5 transition-colors duration-150',
            dark
              ? 'bg-white/[0.06] hover:bg-white/[0.08]'
              : 'bg-muted/40 hover:bg-muted/70',
          )}
        >
          <Avatar className={cn('h-10 w-10 border', dark ? 'border-[#193A47]' : 'border-border')}>
            {creator?.avatarUrl ? <AvatarImage src={creator.avatarUrl} alt="" /> : null}
            <AvatarFallback
              className={cn(
                'text-sm font-bold',
                dark ? 'bg-[#075D60] text-[#25E4D2]' : 'bg-primary/15 text-primary',
              )}
            >
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className={cn('truncate text-sm font-semibold', dark ? 'text-[#F8FAFC]' : 'text-foreground')}>
              {displayName}
            </p>
            <p className={cn('text-caption font-medium', dark ? 'text-[#8197A3]' : 'text-muted-foreground')}>
              Creator · Settings
            </p>
          </div>
        </Link>

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
