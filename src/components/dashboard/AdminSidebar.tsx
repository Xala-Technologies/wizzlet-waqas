import { Link, useLocation, useNavigate } from 'react-router-dom';
import { WizzletLogo } from '@/components/WizzletLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RoleSwitcher } from './RoleSwitcher';

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
  Mail,
  Inbox,
  FileWarning,
  Wallet,
  Bell,
  FileText,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const adminItems: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutGrid },
  { label: 'Creators', href: '/admin/creators', icon: Crown },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'All Accounts', href: '/admin/users', icon: UserCog },

  { label: 'Finance', href: '/admin/finance', icon: Banknote },
  { label: 'Transactions', href: '/admin/transactions', icon: CreditCard },
  { label: 'Platform Fees', href: '/admin/fees', icon: Percent },
  { label: 'Payouts', href: '/admin/payouts', icon: Wallet },
  { label: 'Creator Messaging', href: '/admin/creator-messaging', icon: MessageSquare },
  { label: 'Customer Email', href: '/admin/customer-email', icon: Mail },
  { label: 'Growth Inbox', href: '/admin/growth-manager-inbox', icon: Inbox },
  { label: 'Resolution Cases', href: '/admin/resolution-cases', icon: FileWarning },
  { label: 'Alerts', href: '/admin/alerts', icon: Bell },
  { label: 'Reports', href: '/admin/reports', icon: FileText },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
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
      {item.label}
    </Link>
  );
}

export function AdminSidebar({ mobile = false }: { mobile?: boolean } = {}) {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside className={mobile ? 'flex h-full min-h-0 w-full flex-col bg-card' : 'hidden md:flex w-[220px] flex-col border-r border-border bg-card/80 backdrop-blur-sm'}>
      {!mobile && (
        <div className="px-5 py-5">
          <WizzletLogo size="md" />
        </div>
      )}

      <div className={`px-5 mb-4 ${mobile ? 'pt-4' : ''}`}>
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-1.5">
          <Shield className="h-3.5 w-3.5 text-destructive" />
          <span className="text-[11px] font-medium text-destructive">Admin Panel</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {adminItems.map((item) => (
          <NavItemLink key={item.href} item={item} active={item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)} />
        ))}
      </nav>

      <div className="shrink-0 px-3 py-4 border-t border-border space-y-2">
        <RoleSwitcher />
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
