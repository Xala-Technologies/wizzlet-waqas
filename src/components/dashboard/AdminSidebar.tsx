import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { PrizeletLogo } from '@/components/PrizeletLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RoleSwitcher } from './RoleSwitcher';
import { api } from '@convex/_generated/api';

import {
  LayoutGrid,
  Users,
  UserCog,
  Crown,
  CreditCard,
  Banknote,
  Percent,
  Settings,
  LogOut,
  Shield,
  MessageSquare,
  Megaphone,
  Inbox,
  FileWarning,
  Wallet,
  Bell,
  BellRing,
  FileText,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const adminSections: NavSection[] = [
  {
    title: 'Overview',
    items: [{ label: 'Overview', href: '/admin', icon: LayoutGrid }],
  },
  {
    title: 'People',
    items: [
      { label: 'Creators', href: '/admin/creators', icon: Crown },
      { label: 'Customers', href: '/admin/customers', icon: Users },
      { label: 'All Accounts', href: '/admin/users', icon: UserCog },
    ],
  },
  {
    title: 'Money',
    items: [
      { label: 'Finance', href: '/admin/finance', icon: Banknote },
      { label: 'Transactions', href: '/admin/transactions', icon: CreditCard },
      { label: 'Platform Fees', href: '/admin/fees', icon: Percent },
      { label: 'Payouts', href: '/admin/payouts', icon: Wallet },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Creator Messaging', href: '/admin/creator-messaging', icon: MessageSquare },
      { label: 'Growth Inbox', href: '/admin/growth-manager-inbox', icon: Inbox },
      { label: 'Announcements', href: '/admin/customer-email', icon: Megaphone },
      { label: 'Resolution Cases', href: '/admin/resolution-cases', icon: FileWarning },
      { label: 'Alerts', href: '/admin/alerts', icon: Bell },
      { label: 'Notifications', href: '/admin/notifications', icon: BellRing },
    ],
  },
  {
    title: 'Platform',
    items: [
      { label: 'Reports', href: '/admin/reports', icon: FileText },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

function formatBadge(n: number): string | undefined {
  if (n <= 0) return undefined;
  return n > 9 ? '9+' : String(n);
}

function NavItemLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      to={item.href}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-ui transition-all duration-200 ${
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
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-caption font-bold text-primary-foreground">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function AdminSidebar({ mobile = false }: { mobile?: boolean } = {}) {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const growthUnread = useQuery(
    api.support.mutations.unreadCountAdminGrowth,
    user ? {} : 'skip',
  );
  const resolutionUnread = useQuery(
    api.resolution.mutations.unreadCountAdmin,
    user ? {} : 'skip',
  );
  const notifUnread = useQuery(
    api.notifications.mutations.unreadCount,
    user ? {} : 'skip',
  );

  const handleSignOut = async () => {
    navigate('/');
    await signOut();
  };

  const withBadges = (item: NavItem): NavItem => {
    if (item.href === '/admin/growth-manager-inbox') {
      const badge = formatBadge(growthUnread ?? 0);
      return badge ? { ...item, badge } : item;
    }
    if (item.href === '/admin/resolution-cases') {
      const badge = formatBadge(resolutionUnread ?? 0);
      return badge ? { ...item, badge } : item;
    }
    if (item.href === '/admin/notifications') {
      const badge = formatBadge(notifUnread ?? 0);
      return badge ? { ...item, badge } : item;
    }
    return item;
  };

  return (
    <aside className={mobile ? 'flex h-full min-h-0 w-full flex-col bg-card' : 'hidden md:flex h-full w-[248px] shrink-0 flex-col border-r border-border bg-card'}>
      {!mobile && (
        <div className="px-5 py-5">
          <PrizeletLogo size="md" linkTo="/admin" />
        </div>
      )}

      <div className={`px-5 mb-4 ${mobile ? 'pt-4' : ''}`}>
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-1.5">
          <Shield className="h-3.5 w-3.5 text-destructive" />
          <span className="text-caption font-medium text-destructive">Admin Panel</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-4">
        {adminSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-1 text-caption font-semibold uppercase tracking-wider text-muted-foreground/80">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItemLink
                  key={item.href}
                  item={withBadges(item)}
                  active={item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 px-3 py-4 border-t border-border space-y-2">
        <RoleSwitcher />
        <div className="flex items-center justify-between px-3">
          <span className="text-caption text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground text-ui"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
