import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { SweephLogo } from '@/components/SweephLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RoleSwitcher } from './RoleSwitcher';
import { api } from '@convex/_generated/api';
import { dashboardSidebarAsideClassName } from '@/lib/dashboardSidebar';
import { cn } from '@/lib/utils';
import { useDocumentDark } from '@/hooks/useDocumentDark';
import {
  SIDEBAR_BADGE_CLASS,
  sidebarFooterGhostClass,
  sidebarNavIconClass,
  sidebarNavItemClass,
} from '@/lib/sidebarNav';

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

export function AdminSidebar({ mobile = false }: { mobile?: boolean } = {}) {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const dark = useDocumentDark();

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
            linkTo="/admin"
            variant={dark ? 'dark' : 'light'}
          />
        </div>
      )}

      <div className={cn('mb-3 px-5', mobile ? 'pt-4' : 'pt-4')}>
        <div
          className={cn(
            'flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2',
            dark ? 'bg-[var(--active-bg)]' : 'bg-[var(--brand-50)]',
          )}
        >
          <Shield
            className={cn(
              'h-4 w-4',
              dark ? 'text-[var(--brand-primary)]' : 'text-[var(--brand-700)]',
            )}
          />
          <span
            className={cn(
              'text-caption font-semibold',
              dark ? 'text-[var(--active-text)]' : 'text-[var(--brand-700)]',
            )}
          >
            Admin Panel
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        {adminSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="px-4 text-caption font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavItemLink
                  key={item.href}
                  item={withBadges(item)}
                  dark={dark}
                  active={
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(item.href)
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div
        className={cn(
          'shrink-0 space-y-2 border-t px-3 py-4',
          dark ? 'border-[var(--border-subtle)]' : 'border-border',
        )}
      >
        <RoleSwitcher />
        <div className="flex items-center justify-between px-4">
          <span className="text-caption text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={sidebarFooterGhostClass(dark)}
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
