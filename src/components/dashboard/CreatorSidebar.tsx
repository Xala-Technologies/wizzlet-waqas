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
  LayoutGrid,
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
  FileWarning,
  Settings,
  LogOut,
  ChevronDown,
  Brain,
  Lock,
  Bell,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { RoleSwitcher } from './RoleSwitcher';
import { api } from '@convex/_generated/api';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutGrid;
  badge?: string;
}

/** Primary mockup nav order. */
const primaryItems: NavItem[] = [
  { label: 'Overview', href: '/creator', icon: LayoutGrid },
  { label: 'Picks', href: '/creator/posts', icon: PenLine },
  { label: 'Products', href: '/creator/products', icon: Package },
  { label: 'Subscribers', href: '/creator/subscribers', icon: Users },
  { label: 'Performance', href: '/creator/performance-tracker', icon: TrendingUp },
  { label: 'Messages', href: '/creator/messages', icon: MessageSquare },
  { label: 'Marketing', href: '/creator/promo', icon: Megaphone },
  { label: 'Earnings', href: '/creator/earnings', icon: DollarSign },
  { label: 'Settings', href: '/creator/settings', icon: Settings },
];

const moreItems: NavItem[] = [
  { label: 'Growth Manager', href: '/creator/personal-growth-manager', icon: Brain },
  { label: 'Links', href: '/creator/links', icon: Link2 },
  { label: 'Referrals', href: '/creator/referrals', icon: UserPlus },
  { label: 'Access Control', href: '/creator/access-control', icon: Lock },
  { label: 'Smart Pricing', href: '/creator/smart-pricing', icon: TrendingUp },
  { label: 'Payouts', href: '/creator/payouts', icon: Wallet },
  { label: 'Resolution Case', href: '/creator/resolution-case', icon: FileWarning },
  { label: 'Notifications', href: '/creator/notifications', icon: Bell },
];

function formatBadge(n: number): string | undefined {
  if (n <= 0) return undefined;
  return n > 9 ? '9+' : String(n);
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === '/creator') return pathname === '/creator';
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
      {item.badge && (
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
      )}
    </Link>
  );
}

export function CreatorSidebar({ mobile = false }: { mobile?: boolean } = {}) {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const dark = !mobile; // desktop mockup chrome; mobile drawer stays readable on light sheet

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
  const notifUnread = useQuery(api.notifications.mutations.unreadCount, user ? {} : 'skip');

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
    if (item.href === '/creator/notifications') {
      const badge = formatBadge(notifUnread ?? 0);
      return badge ? { ...item, badge } : item;
    }
    return item;
  };

  const readiness = useMemo(() => {
    if (!creator) return { label: 'Finish setup', detail: 'Complete your profile', pct: 20 };
    let steps = 0;
    if (creator.username) steps += 1;
    if (creator.displayName) steps += 1;
    if (creator.isPublished) steps += 1;
    if (creator.verificationStatus === 'verified') steps += 1;
    const pct = Math.round((steps / 4) * 100);
    if (creator.verificationStatus === 'verified' && creator.isPublished) {
      return { label: 'Verified creator', detail: 'Profile live', pct: 100 };
    }
    if (creator.isPublished) {
      return { label: 'Published', detail: 'Profile is live', pct };
    }
    return { label: 'Profile status', detail: 'Publish to go live', pct: Math.max(pct, 25) };
  }, [creator]);

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
            Turn your picks into profit.
          </p>
        </div>
      )}

      <nav className={cn('flex-1 space-y-1 overflow-y-auto px-3 pb-4', mobile && 'pt-4')}>
        {primaryItems.map((item) => (
          <NavItemLink
            key={item.href}
            item={withBadges(item)}
            active={isActivePath(pathname, item.href)}
            dark={dark}
          />
        ))}

        <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
          <CollapsibleTrigger
            className={cn(
              'mt-2 flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium',
              dark ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-muted-foreground hover:bg-muted/60',
            )}
          >
            More
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform', moreOpen ? 'rotate-0' : '-rotate-90')}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-0.5">
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
          'shrink-0 space-y-3 px-3 py-4',
          dark ? 'border-t border-white/10' : 'border-t border-border',
        )}
      >
        <div
          className={cn(
            'rounded-xl p-3',
            dark ? 'border border-white/10 bg-white/5' : 'border border-border bg-muted/40',
          )}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className={cn('text-xs font-bold', dark ? 'text-white' : 'text-foreground')}>
              {readiness.label}
            </p>
            {creator?.verificationStatus === 'verified' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                <ShieldCheck className="h-3 w-3" aria-hidden />
                Active
              </span>
            ) : (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold',
                  dark ? 'bg-white/10 text-slate-300' : 'bg-muted text-muted-foreground',
                )}
              >
                {readiness.pct}%
              </span>
            )}
          </div>
          <p className={cn('mb-3 text-[11px] leading-snug', dark ? 'text-slate-400' : 'text-muted-foreground')}>
            {readiness.detail}
          </p>
          <div
            className={cn(
              'mb-3 h-1.5 overflow-hidden rounded-full',
              dark ? 'bg-white/10' : 'bg-muted',
            )}
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${readiness.pct}%` }}
            />
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className={cn(
              'h-8 w-full text-xs font-semibold',
              dark &&
                'border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white',
            )}
          >
            <Link to="/creator/settings">View profile setup</Link>
          </Button>
        </div>

        {mobile ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sm text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link to="/support">
              <HelpCircle className="mr-2 h-3.5 w-3.5" />
              Help & Support
            </Link>
          </Button>
        ) : null}

        {!mobile && (
          <div className="[&_button]:border-white/15 [&_button]:bg-white/5 [&_button]:text-slate-100 [&_button]:hover:bg-white/10 [&_button_.text-muted-foreground]:text-slate-400">
            <RoleSwitcher />
          </div>
        )}

        {mobile ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sm text-muted-foreground hover:text-foreground"
            onClick={() => void handleSignOut()}
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Log out
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
