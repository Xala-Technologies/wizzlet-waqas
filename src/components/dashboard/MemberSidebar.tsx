import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { PrizeletLogo } from '@/components/PrizeletLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { dashboardSidebarAsideClassName } from '@/lib/dashboardSidebar';
import {
  Home,
  Search,
  UserPlus,
  MessageSquare,
  Settings,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import { api } from '@convex/_generated/api';
import { RoleSwitcher } from './RoleSwitcher';
import { useDemoMemberStoreOptional } from '@/components/demo/demoMemberStore';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: typeof Home;
  badge?: string;
}

/** Mockup nav labels; chrome matches creator dark sidebar. */
const memberItems: NavItem[] = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Discover', href: '/dashboard/discover', icon: Search },
  { label: 'My Creators', href: '/dashboard/subscriptions-billing', icon: UserPlus },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export const demoMemberItems: NavItem[] = [
  { label: 'Home', href: '/demo/member', icon: Home },
  { label: 'Discover', href: '/demo/member/discover', icon: Search },
  { label: 'My Creators', href: '/demo/member/subscriptions-billing', icon: UserPlus },
  { label: 'Messages', href: '/demo/member/messages', icon: MessageSquare },
  { label: 'Settings', href: '/demo/member/settings', icon: Settings },
];

function formatBadge(n: number): string | undefined {
  if (n <= 0) return undefined;
  return n > 9 ? '9+' : String(n);
}

function isActivePath(pathname: string, href: string, baseRoute: string): boolean {
  if (href === baseRoute) return pathname === baseRoute;
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
            dark ? 'bg-rose-500 text-white' : 'bg-primary text-primary-foreground',
          )}
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

export function MemberSidebar({ demo = false, mobile = false }: { demo?: boolean; mobile?: boolean } = {}) {
  const { signOut, user } = useAuth();
  const demoStore = useDemoMemberStoreOptional();
  const [searchParams] = useSearchParams();
  const forceDemoPreview = searchParams.get('demo') === '1';
  const liveDmUnread = useQuery(
    api.messaging.mutations.unreadCountSubscriber,
    !demo && user ? {} : 'skip',
  );
  const dmUnread = demo || forceDemoPreview ? 2 : (liveDmUnread ?? 0);
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const dark = !mobile;
  const items = demo ? demoMemberItems : memberItems;
  const baseRoute = demo ? '/demo/member' : '/dashboard';

  const handleSignOut = async () => {
    if (demo) {
      navigate('/');
      return;
    }
    navigate('/');
    await signOut();
  };

  const withBadge = (item: NavItem): NavItem => {
    if (item.href.endsWith('/messages') || (demo && item.label === 'Messages')) {
      const badge = formatBadge(dmUnread);
      return badge ? { ...item, badge } : item;
    }
    if (demo && demoStore && demoStore.metrics.unread > 0 && item.href.endsWith('/notifications')) {
      return { ...item, badge: formatBadge(demoStore.metrics.unread) };
    }
    return item;
  };

  return (
    <aside className={dashboardSidebarAsideClassName(mobile, undefined, dark ? 'dark' : 'light')}>
      {!mobile && (
        <div className="px-5 pb-4 pt-6">
          <PrizeletLogo
            size="md"
            linkTo={baseRoute}
            className="[&>span:last-child]:text-white"
          />
          <p className="mt-2 text-xs font-medium leading-snug text-slate-400">
            CREATE. GROW. EARN.
          </p>
        </div>
      )}

      <nav className={cn('flex-1 space-y-1 overflow-y-auto px-3 pb-4', mobile && 'pt-4')}>
        {items.map((item) => (
          <NavItemLink
            key={item.href}
            item={withBadge(item)}
            active={isActivePath(pathname, item.href, baseRoute)}
            dark={dark}
          />
        ))}
      </nav>

      <div
        className={cn(
          'shrink-0 space-y-3 px-3 py-4',
          dark ? 'border-t border-white/10' : 'border-t border-border',
        )}
      >
        {!mobile && (
          <div
            className={cn(
              'rounded-2xl p-4',
              dark
                ? 'border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950'
                : 'border border-border bg-muted/40',
            )}
          >
            <p
              className={cn(
                'text-sm font-bold leading-snug tracking-tight',
                dark ? 'text-white' : 'text-foreground',
              )}
            >
              Better picks. A brighter you.
            </p>
            <p
              className={cn(
                'mt-1.5 text-xs font-medium leading-relaxed',
                dark ? 'text-slate-400' : 'text-muted-foreground',
              )}
            >
              Follow top creators and be part of a winning community.
            </p>
            <Button
              asChild
              size="sm"
              className="mt-3 h-9 w-full rounded-xl text-xs font-semibold"
            >
              <Link to={demo ? '/demo/member/discover' : '/dashboard/discover'}>
                Discover Creators →
              </Link>
            </Button>
          </div>
        )}

        {!mobile && (
          <p
            className={cn(
              'px-1 text-[10px] font-medium uppercase tracking-[0.14em]',
              dark ? 'text-slate-500' : 'text-muted-foreground',
            )}
          >
            Prizelet. Picks. People. Profit.
          </p>
        )}

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

        {!demo && !mobile && (
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
