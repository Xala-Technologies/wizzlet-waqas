import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { PrizeletLogo } from '@/components/PrizeletLogo';
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
  MessageSquare,
} from 'lucide-react';
import { api } from '@convex/_generated/api';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RoleSwitcher } from './RoleSwitcher';
import { useDemoMemberStoreOptional } from '@/components/demo/demoMemberStore';


interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const memberSections: NavSection[] = [
  {
    label: 'Main',
    items: [
      { label: 'Feed', href: '/dashboard', icon: LayoutGrid },
      { label: 'Discover', href: '/dashboard/discover', icon: Compass },
      { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    ],
  },
  {
    label: 'Library',
    items: [
      { label: 'My Bet Tracker', href: '/dashboard/results', icon: Trophy },
      { label: 'Saved', href: '/dashboard/saved', icon: Bookmark },
      { label: 'Activity', href: '/dashboard/activity', icon: Activity },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Subscriptions & Billing', href: '/dashboard/subscriptions-billing', icon: CreditCard },
      { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];

/** Flat list kept for demo mode; no Messages — demo has no `/demo/member/messages` route. */
export const demoMemberItems: NavItem[] = [
  { label: 'Feed', href: '/demo/member', icon: LayoutGrid },
  { label: 'Discover', href: '/demo/member/discover', icon: Compass },
  { label: 'My Bet Tracker', href: '/demo/member/results', icon: Trophy },
  { label: 'Saved', href: '/demo/member/saved', icon: Bookmark },
  { label: 'Activity', href: '/demo/member/activity', icon: Activity },
  { label: 'Subscriptions & Billing', href: '/demo/member/subscriptions-billing', icon: CreditCard },
  { label: 'Notifications', href: '/demo/member/notifications', icon: Bell },
  { label: 'Settings', href: '/demo/member/settings', icon: Settings },
];

const demoMemberSections: NavSection[] = [
  {
    label: 'Main',
    items: [
      { label: 'Feed', href: '/demo/member', icon: LayoutGrid },
      { label: 'Discover', href: '/demo/member/discover', icon: Compass },
    ],
  },
  {
    label: 'Library',
    items: [
      { label: 'My Bet Tracker', href: '/demo/member/results', icon: Trophy },
      { label: 'Saved', href: '/demo/member/saved', icon: Bookmark },
      { label: 'Activity', href: '/demo/member/activity', icon: Activity },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Subscriptions & Billing', href: '/demo/member/subscriptions-billing', icon: CreditCard },
      { label: 'Notifications', href: '/demo/member/notifications', icon: Bell },
      { label: 'Settings', href: '/demo/member/settings', icon: Settings },
    ],
  },
];


function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 dark:text-muted-foreground/70 select-none">
      {children}
    </span>
  );
}

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
  const sections = demo ? demoMemberSections : memberSections;
  const baseRoute = demo ? '/demo/member' : '/dashboard';

  const handleSignOut = async () => {
    if (demo) { navigate('/'); return; }
    await signOut();
    navigate('/');
  };

  const withBadge = (item: NavItem): NavItem =>
    item.href.endsWith('/notifications') && unread > 0
      ? { ...item, badge: unread > 9 ? '9+' : String(unread) }
      : item;

  return (
    <aside className={mobile ? 'flex h-full min-h-0 w-full flex-col bg-card' : 'hidden md:flex w-[220px] flex-col border-r border-border bg-card/80 backdrop-blur-sm'}>
      {!mobile && (
        <div className="px-5 py-5">
          <PrizeletLogo size="md" />
        </div>
      )}

      <nav className={`flex-1 overflow-y-auto px-3 pb-4 space-y-5 ${mobile ? 'pt-4' : ''}`}>
        {sections.map((section) => (
          <div key={section.label} className="space-y-0.5">
            <SectionLabel>{section.label}</SectionLabel>
            <div className="mt-1.5 space-y-0.5">
              {section.items.map((item) => (
                <NavItemLink
                  key={item.href}
                  item={withBadge(item)}
                  active={item.href === baseRoute ? pathname === baseRoute : pathname.startsWith(item.href)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 px-3 py-4 border-t border-border space-y-2">
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
