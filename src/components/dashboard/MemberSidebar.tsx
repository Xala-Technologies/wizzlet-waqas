import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { WizzletLogo } from '@/components/WizzletLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LayoutGrid,
  CreditCard,
  Compass,
  Settings,
  LogOut,
  Trophy,
  Bookmark,
  Bell,
  Activity,
} from 'lucide-react';
import { api } from '@convex/_generated/api';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RoleSwitcher } from './RoleSwitcher';
import { demoMemberUnread, useDemoMemberStoreOptional } from '@/components/demo/demoMemberStore';


interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const memberItems: NavItem[] = [
  { label: 'Feed', href: '/dashboard', icon: LayoutGrid },
  { label: 'Subscriptions & Billing', href: '/dashboard/subscriptions-billing', icon: CreditCard },
  { label: 'My Results', href: '/dashboard/results', icon: Trophy },
  { label: 'Saved', href: '/dashboard/saved', icon: Bookmark },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { label: 'Discover', href: '/dashboard/discover', icon: Compass },
  { label: 'Activity', href: '/dashboard/activity', icon: Activity },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export const demoMemberItems: NavItem[] = [
  { label: 'Feed', href: '/demo/member', icon: LayoutGrid },
  { label: 'Subscriptions & Billing', href: '/demo/member/subscriptions-billing', icon: CreditCard },
  { label: 'My Results', href: '/demo/member/results', icon: Trophy },
  { label: 'Saved', href: '/demo/member/saved', icon: Bookmark },
  { label: 'Notifications', href: '/demo/member/notifications', icon: Bell },
  { label: 'Discover', href: '/demo/member/discover', icon: Compass },
  { label: 'Activity', href: '/demo/member/activity', icon: Activity },
  { label: 'Settings', href: '/demo/member/settings', icon: Settings },
];


function NavItemLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      to={item.href}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all duration-200 ${
        active
          ? 'bg-primary/10 text-primary font-medium shadow-[inset_2px_0_0_0_hsl(var(--primary))]'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
      }`}
    >
      <item.icon
        className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
          active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
        }`}
      />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function MemberSidebar({ demo = false, mobile = false }: { demo?: boolean; mobile?: boolean }) {
  const { signOut, user } = useAuth();
  const demoStore = useDemoMemberStoreOptional();
  const liveUnread = useQuery(
    api.notifications.mutations.unreadCount,
    !demo && user ? {} : 'skip',
  );
  const unread = demo && demoStore ? demoStore.metrics.unread : (liveUnread ?? 0);
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const items = demo ? demoMemberItems : memberItems;
  const baseRoute = demo ? '/demo/member' : '/dashboard';

  const handleSignOut = async () => {
    if (demo) { navigate('/'); return; }
    await signOut();
    navigate('/');
  };

  return (
    <aside className={mobile ? 'flex h-full w-full flex-col bg-card' : 'hidden md:flex w-[220px] flex-col border-r border-border bg-card/80 backdrop-blur-sm'}>
      <div className="px-5 py-5">
        <WizzletLogo size="md" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {items.map((item) => (
          <NavItemLink
            key={item.href}
            item={
              item.href.endsWith('/notifications') && unread > 0
                ? { ...item, badge: unread > 9 ? '9+' : String(unread) }
                : item
            }
            active={item.href === baseRoute ? pathname === baseRoute : pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-border space-y-2">
        {!demo && <RoleSwitcher />}
        <div className="flex items-center justify-between px-3">
          <span className="text-[11px] text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground text-[13px]"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
