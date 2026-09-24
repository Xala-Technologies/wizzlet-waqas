import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { SweephLogo } from '@/components/SweephLogo';
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
import {
  SIDEBAR_BADGE_CLASS,
  sidebarFooterGhostClass,
  sidebarNavIconClass,
  sidebarNavItemClass,
} from '@/lib/sidebarNav';

interface NavItem {
  label: string;
  href: string;
  icon: typeof Home;
  badge?: string;
}

/** Member nav — same chrome language as creator. */
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
    <Link to={item.href} className={sidebarNavItemClass(active, dark)}>
      <item.icon className={sidebarNavIconClass(active, dark)} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge ? <span className={SIDEBAR_BADGE_CLASS}>{item.badge}</span> : null}
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
        <div className="border-b border-[#193A47] px-5 pb-5 pt-6">
          <SweephLogo size="sidebar" linkTo={baseRoute} variant="dark" />
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
          'shrink-0 space-y-2 px-3 py-4',
          dark ? 'border-t border-[#193A47]' : 'border-t border-border',
        )}
      >
        {!mobile && !demo && (
          <div
            className={cn(
              'rounded-[var(--radius-lg)] border p-4',
              dark ? 'border-[#214250] bg-[#102D3B]' : 'border-border bg-muted/40',
            )}
          >
            <p
              className={cn(
                'text-sm font-bold leading-snug tracking-tight',
                dark ? 'text-[#F8FAFC]' : 'text-foreground',
              )}
            >
              Find creators worth following
            </p>
            <p
              className={cn(
                'mt-1.5 text-caption font-medium leading-relaxed',
                dark ? 'text-[#8197A3]' : 'text-muted-foreground',
              )}
            >
              Discover verified voices and unlock premium content in one place.
            </p>
            <Button asChild size="sm" className="mt-3 h-10 w-full font-semibold">
              <Link to="/dashboard/discover">Discover creators</Link>
            </Button>
          </div>
        )}

        {!demo && !mobile && <RoleSwitcher tone={dark ? 'dark' : 'light'} />}

        {/* Help / Log out live in the top-bar account menu (desktop) */}
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
