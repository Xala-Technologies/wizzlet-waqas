import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { PrizeletLogo } from '@/components/PrizeletLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  LogOut,
  ChevronDown,
  ChevronRight,
  Brain,
  HelpCircle,
  Ellipsis,
  Percent,
} from 'lucide-react';
import { useState } from 'react';
import { RoleSwitcher } from './RoleSwitcher';
import { api } from '@convex/_generated/api';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
    <Link
      to={item.href}
      className={cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
        dark
          ? active
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-slate-300 hover:bg-white/5 hover:text-white'
          : active
            ? 'bg-primary/10 text-primary font-medium shadow-[inset_2px_0_0_0_hsl(var(--primary))]'
            : 'text-foreground hover:bg-muted/60',
      )}
    >
      <item.icon
        className={cn(
          'h-4 w-4 shrink-0',
          dark
            ? active
              ? 'text-primary-foreground'
              : 'text-slate-400 group-hover:text-white'
            : active
              ? 'text-primary'
              : 'text-muted-foreground group-hover:text-foreground',
        )}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span
          className={cn(
            'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
            dark
              ? 'bg-rose-500 text-white'
              : 'bg-primary px-1 text-caption text-primary-foreground',
          )}
        >
          {item.badge}
        </span>
      ) : null}
      {item.chevron && !item.badge ? (
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 shrink-0',
            dark
              ? active
                ? 'text-primary-foreground/80'
                : 'text-slate-500 group-hover:text-slate-300'
              : 'text-muted-foreground',
          )}
          aria-hidden
        />
      ) : null}
    </Link>
  );
}

export function CreatorSidebar({ mobile = false }: { mobile?: boolean } = {}) {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const hash = location.hash;
  const search = location.search;
  const dark = !mobile;

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

  const handleSignOut = async () => {
    navigate('/');
    await signOut();
  };

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
        <div className="px-5 pb-4 pt-6">
          <PrizeletLogo
            size="md"
            linkTo="/creator"
            className="[&>span:last-child]:text-white"
          />
          <p className="mt-2 text-xs font-medium leading-snug text-slate-400">
            Turn your content into income.
          </p>
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
                      dark ? 'border-white/10' : 'border-border',
                    )}
                  >
                    {marketingChildItems.map((child) => {
                      const childActive = isMarketingChildActive(pathname, child.href);
                      return (
                        <Link
                          key={child.href}
                          to={child.href}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                            dark
                              ? childActive
                                ? 'text-white'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                              : childActive
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                          )}
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 shrink-0 rounded-full',
                              childActive
                                ? 'bg-sky-400'
                                : dark
                                  ? 'bg-transparent'
                                  : 'bg-transparent',
                            )}
                            aria-hidden
                          />
                          <span className="truncate">{child.label}</span>
                        </Link>
                      );
                    })}
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
                      dark ? 'border-white/10' : 'border-border',
                    )}
                  >
                    {earningsChildItems.map((child) => {
                      const childActive = isEarningsChildActive(pathname, child.href, hash);
                      return (
                        <Link
                          key={child.href}
                          to={child.href}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                            dark
                              ? childActive
                                ? 'text-white'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                              : childActive
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                          )}
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 shrink-0 rounded-full',
                              childActive ? 'bg-sky-400' : 'bg-transparent',
                            )}
                            aria-hidden
                          />
                          <span className="truncate">{child.label}</span>
                        </Link>
                      );
                    })}
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
                      dark ? 'border-white/10' : 'border-border',
                    )}
                  >
                    {settingsChildItems.map((child) => {
                      const childActive = isSettingsChildActive(pathname, search, child.href);
                      return (
                        <Link
                          key={child.href}
                          to={child.href}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                            dark
                              ? childActive
                                ? 'text-white'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                              : childActive
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                          )}
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 shrink-0 rounded-full',
                              childActive ? 'bg-sky-400' : 'bg-transparent',
                            )}
                            aria-hidden
                          />
                          <span className="truncate">{child.label}</span>
                        </Link>
                      );
                    })}
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
              'group mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              dark
                ? moreHasActive
                  ? 'bg-white/10 text-white'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
                : moreHasActive
                  ? 'bg-muted text-foreground'
                  : 'text-foreground hover:bg-muted/60',
            )}
          >
            <Ellipsis
              className={cn(
                'h-4 w-4 shrink-0',
                dark
                  ? moreHasActive
                    ? 'text-white'
                    : 'text-slate-400 group-hover:text-white'
                  : moreHasActive
                    ? 'text-foreground'
                    : 'text-muted-foreground group-hover:text-foreground',
              )}
            />
            <span className="flex-1 truncate text-left">More</span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 shrink-0 transition-transform',
                moreOpen ? 'rotate-0' : '-rotate-90',
                dark ? 'text-slate-400' : 'text-muted-foreground',
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent
            className={cn(
              'mt-1 ml-4 space-y-0.5 border-l pl-2',
              dark ? 'border-white/10' : 'border-border',
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
          dark ? 'border-t border-white/10' : 'border-t border-border',
        )}
      >
        {!mobile && (
          <div className="[&_button]:border-white/15 [&_button]:bg-white/5 [&_button]:text-slate-100 [&_button]:hover:bg-white/10 [&_button_.text-muted-foreground]:text-slate-400">
            <RoleSwitcher />
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'w-full justify-start text-sm',
            dark
              ? 'text-slate-300 hover:bg-white/5 hover:text-white'
              : 'text-muted-foreground hover:text-foreground',
          )}
          asChild
        >
          <Link to="/support">
            <HelpCircle className="mr-2 h-3.5 w-3.5" />
            Help & Support
          </Link>
        </Button>

        <div
          className={cn(
            'flex items-center gap-3 rounded-xl px-2 py-2',
            dark ? 'bg-white/5' : 'bg-muted/40',
          )}
        >
          <Avatar className="h-9 w-9 border border-white/10">
            {creator?.avatarUrl ? <AvatarImage src={creator.avatarUrl} alt="" /> : null}
            <AvatarFallback
              className={cn(
                'text-xs font-bold',
                dark ? 'bg-primary/30 text-white' : 'bg-primary/15 text-primary',
              )}
            >
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className={cn('truncate text-sm font-semibold', dark ? 'text-white' : 'text-foreground')}>
              {displayName}
            </p>
            <p className={cn('text-[11px] font-medium', dark ? 'text-slate-400' : 'text-muted-foreground')}>
              Creator
            </p>
          </div>
          <Link
            to="/creator/settings"
            aria-label="Account options"
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-lg',
              dark ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <Ellipsis className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'w-full justify-start text-sm',
            dark
              ? 'text-slate-300 hover:bg-white/5 hover:text-white'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() => void handleSignOut()}
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          Log out
        </Button>
      </div>
    </aside>
  );
}
