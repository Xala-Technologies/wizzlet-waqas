import { Link, useLocation, useNavigate } from 'react-router-dom';
import { WizzletLogo } from '@/components/WizzletLogo';
import { Button } from '@/components/ui/button';
import { useDemoAdminStore } from '@/components/demo/demoAdminStore';
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
}

const demoAdminItems: NavItem[] = [
  { label: 'Overview', href: '/demo/admin', icon: LayoutGrid },
  { label: 'Creators', href: '/demo/admin/creators', icon: Crown },
  { label: 'Users', href: '/demo/admin/users', icon: Users },
  { label: 'Transactions', href: '/demo/admin/transactions', icon: CreditCard },
  { label: 'Platform Fees', href: '/demo/admin/fees', icon: Percent },
  { label: 'Settings', href: '/demo/admin/settings', icon: Settings },
];

function NavItemLink({ item, active, badge = 0 }: { item: NavItem; active: boolean; badge?: number }) {
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
      {badge > 0 && (
        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
          {badge}
        </span>
      )}
    </Link>
  );
}

const isActive = (href: string, pathname: string) =>
  href === '/demo/admin' ? pathname === '/demo/admin' : pathname.startsWith(href);

export function DemoAdminSidebar({ mobile = false }: { mobile?: boolean } = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const { metrics } = useDemoAdminStore();
  const pending = metrics.pendingApplications;


  return (
    <aside className={mobile ? 'flex h-full w-full flex-col bg-card' : 'hidden md:flex w-[220px] flex-col border-r border-border bg-card/80 backdrop-blur-sm'}>
      <div className="px-5 py-5">
        <WizzletLogo size="md" />
      </div>

      <div className="px-5 mb-4">
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-1.5">
          <Shield className="h-3.5 w-3.5 text-destructive" />
          <span className="text-[11px] font-medium text-destructive">Admin Panel</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {demoAdminItems.map((item) => (
          <NavItemLink
            key={item.href}
            item={item}
            active={isActive(item.href, pathname)}
            badge={item.href === '/demo/admin/creators' ? pending : 0}
          />
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground text-[13px]"
          onClick={() => navigate('/')}
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          Exit Demo
        </Button>
      </div>
    </aside>
  );
}
