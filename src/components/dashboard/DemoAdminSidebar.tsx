import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SweephLogo } from '@/components/SweephLogo';
import { Button } from '@/components/ui/button';
import { useDemoAdminStore } from '@/components/demo/demoAdminStore';
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
  Crown,
  CreditCard,
  Percent,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const demoAdminItems: NavItem[] = [
  { label: 'Overview', href: '/demo/admin', icon: LayoutGrid },
  { label: 'Creators', href: '/demo/admin/creators', icon: Crown },
  { label: 'Users', href: '/demo/admin/users', icon: Users },
  { label: 'Transactions', href: '/demo/admin/transactions', icon: CreditCard },
  { label: 'Platform Fees', href: '/demo/admin/fees', icon: Percent },
  { label: 'Settings', href: '/demo/admin/settings', icon: Settings },
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

const isActive = (href: string, pathname: string) =>
  href === '/demo/admin' ? pathname === '/demo/admin' : pathname.startsWith(href);

export function DemoAdminSidebar({ mobile = false }: { mobile?: boolean } = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const dark = useDocumentDark();
  const { metrics } = useDemoAdminStore();
  const pending = metrics.pendingApplications;

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
            linkTo="/demo/admin"
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

      <nav className={cn('flex-1 space-y-1 overflow-y-auto px-3 pb-4', mobile && 'pt-1')}>
        {demoAdminItems.map((item) => {
          const badge =
            item.href === '/demo/admin/creators' ? formatBadge(pending) : undefined;
          return (
            <NavItemLink
              key={item.href}
              item={badge ? { ...item, badge } : item}
              active={isActive(item.href, pathname)}
              dark={dark}
            />
          );
        })}
      </nav>

      <div
        className={cn(
          'border-t px-3 py-4',
          dark ? 'border-[var(--border-subtle)]' : 'border-border',
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          className={sidebarFooterGhostClass(dark)}
          onClick={() => navigate('/')}
        >
          <LogOut className="h-4 w-4" />
          Exit demo
        </Button>
      </div>
    </aside>
  );
}
