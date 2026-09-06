import { Link, useLocation, useNavigate } from 'react-router-dom';
import { WizzletLogo } from '@/components/WizzletLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
} from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RoleSwitcher } from './RoleSwitcher';


interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutGrid;
}

const mainItems: NavItem[] = [
  { label: 'Overview', href: '/creator', icon: LayoutGrid },
  { label: 'Create Post', href: '/creator/posts', icon: PenLine },
  { label: 'Products', href: '/creator/products', icon: Package },
  { label: 'Subscribers', href: '/creator/subscribers', icon: Users },
  { label: 'Performance Tracker', href: '/creator/performance-tracker', icon: TrendingUp },
];

const growthItems: NavItem[] = [
  { label: 'Growth Manager', href: '/creator/personal-growth-manager', icon: Brain },
  { label: 'Smart Pricing', href: '/creator/smart-pricing', icon: TrendingUp },
  { label: 'Promo', href: '/creator/promo', icon: Megaphone },
  { label: 'Access Control', href: '/creator/access-control', icon: Lock },
  { label: 'Messages', href: '/creator/messages', icon: MessageSquare },
  { label: 'Links', href: '/creator/links', icon: Link2 },
  { label: 'Referrals', href: '/creator/referrals', icon: UserPlus },
];

const financeItems: NavItem[] = [
  { label: 'Earnings', href: '/creator/earnings', icon: DollarSign },
  { label: 'Payouts', href: '/creator/payouts', icon: Wallet },
  { label: 'Resolution Case', href: '/creator/resolution-case', icon: FileWarning },
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 select-none">
      {children}
    </span>
  );
}

function CollapsibleSection({
  label,
  items,
  pathname,
  defaultOpen = false,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  defaultOpen?: boolean;
}) {
  const hasActive = items.some((i) => pathname === i.href);
  const [open, setOpen] = useState(defaultOpen || hasActive);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-1.5 group cursor-pointer">
        <SectionLabel>{label}</SectionLabel>
        <ChevronDown
          className={`h-3 w-3 text-muted-foreground/40 transition-transform duration-200 ${
            open ? 'rotate-0' : '-rotate-90'
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 mt-1">
        {items.map((item) => (
          <NavItemLink key={item.href} item={item} active={pathname === item.href} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function CreatorSidebar({ mobile = false }: { mobile?: boolean } = {}) {
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
      {/* Logo — omitted in mobile drawer (shown in MobileTopBar) */}
      {!mobile && (
        <div className="px-5 py-5">
          <WizzletLogo size="md" />
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto px-3 pb-4 space-y-5 ${mobile ? 'pt-4' : ''}`}>
        {/* Main */}
        <div className="space-y-0.5">
          <SectionLabel>Main</SectionLabel>
          <div className="mt-1.5 space-y-0.5">
            {mainItems.map((item) => (
              <NavItemLink key={item.href} item={item} active={pathname === item.href} />
            ))}
          </div>
        </div>

        {/* Growth - Collapsible */}
        <CollapsibleSection label="Growth" items={growthItems} pathname={pathname} defaultOpen />

        {/* Finance - Collapsible */}
        <CollapsibleSection label="Finance" items={financeItems} pathname={pathname} />

        {/* Settings */}
        <div className="space-y-0.5">
          <NavItemLink
            item={{ label: 'Settings', href: '/creator/settings', icon: Settings }}
            active={pathname === '/creator/settings'}
          />
        </div>
      </nav>

      {/* Footer */}
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
