import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { PrizeletLogo } from '@/components/PrizeletLogo';
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
  Bell,
} from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RoleSwitcher } from './RoleSwitcher';
import { api } from '@convex/_generated/api';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutGrid;
  badge?: string;
}

const mainItems: NavItem[] = [
  { label: 'Overview', href: '/creator', icon: LayoutGrid },
  { label: 'Create Post', href: '/creator/posts', icon: PenLine },
  { label: 'Products', href: '/creator/products', icon: Package },
  { label: 'Subscribers', href: '/creator/subscribers', icon: Users },
  { label: 'Performance Tracker', href: '/creator/performance-tracker', icon: TrendingUp },
];

const growthPrimaryItems: NavItem[] = [
  { label: 'Growth Manager', href: '/creator/personal-growth-manager', icon: Brain },
  { label: 'Messages', href: '/creator/messages', icon: MessageSquare },
];

const growthToolItems: NavItem[] = [
  { label: 'Promo', href: '/creator/promo', icon: Megaphone },
  { label: 'Links', href: '/creator/links', icon: Link2 },
  { label: 'Referrals', href: '/creator/referrals', icon: UserPlus },
  { label: 'Access Control', href: '/creator/access-control', icon: Lock },
  { label: 'Smart Pricing', href: '/creator/smart-pricing', icon: TrendingUp },
];

const financeItems: NavItem[] = [
  { label: 'Earnings', href: '/creator/earnings', icon: DollarSign },
  { label: 'Payouts', href: '/creator/payouts', icon: Wallet },
  { label: 'Resolution Case', href: '/creator/resolution-case', icon: FileWarning },
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 text-caption font-semibold uppercase tracking-widest text-muted-foreground/50 dark:text-muted-foreground/70 select-none">
      {children}
    </span>
  );
}

function CollapsibleSection({
  label,
  items,
  pathname,
  defaultOpen = false,
  nestedTools,
  badgeFor,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  defaultOpen?: boolean;
  nestedTools?: NavItem[];
  badgeFor?: (item: NavItem) => NavItem;
}) {
  const decorate = badgeFor ?? ((i: NavItem) => i);
  const allItems = nestedTools ? [...items, ...nestedTools] : items;
  const hasActive = allItems.some((i) => pathname === i.href);
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
          <NavItemLink key={item.href} item={decorate(item)} active={pathname === item.href} />
        ))}
        {nestedTools && nestedTools.length > 0 && (
          <div className="pt-2 mt-1.5 space-y-0.5">
            <SectionLabel>Tools</SectionLabel>
            <div className="mt-1 space-y-0.5">
              {nestedTools.map((item) => (
                <NavItemLink key={item.href} item={decorate(item)} active={pathname === item.href} />
              ))}
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function CreatorSidebar({ mobile = false }: { mobile?: boolean } = {}) {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const dmUnread = useQuery(
    api.messaging.mutations.unreadCountCreator,
    user ? {} : 'skip',
  );
  const growthUnread = useQuery(
    api.support.mutations.unreadCountCreatorGrowth,
    user ? {} : 'skip',
  );
  const resolutionUnread = useQuery(
    api.resolution.mutations.unreadCountCreator,
    user ? {} : 'skip',
  );
  const notifUnread = useQuery(
    api.notifications.mutations.unreadCount,
    user ? {} : 'skip',
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const withBadges = (item: NavItem): NavItem => {
    if (item.href === '/creator/messages') {
      const badge = formatBadge(dmUnread ?? 0);
      return badge ? { ...item, badge } : item;
    }
    if (item.href === '/creator/personal-growth-manager') {
      const badge = formatBadge(growthUnread ?? 0);
      return badge ? { ...item, badge } : item;
    }
    if (item.href === '/creator/resolution-case') {
      const badge = formatBadge(resolutionUnread ?? 0);
      return badge ? { ...item, badge } : item;
    }
    if (item.href === '/creator/notifications') {
      const badge = formatBadge(notifUnread ?? 0);
      return badge ? { ...item, badge } : item;
    }
    return item;
  };

  return (
    <aside className={mobile ? 'flex h-full min-h-0 w-full flex-col bg-card' : 'hidden md:flex w-[220px] flex-col border-r border-border bg-card/80 backdrop-blur-sm'}>
      {!mobile && (
        <div className="px-5 py-5">
          <PrizeletLogo size="md" />
        </div>
      )}

      <nav className={`flex-1 overflow-y-auto px-3 pb-4 space-y-5 ${mobile ? 'pt-4' : ''}`}>
        <div className="space-y-0.5">
          <SectionLabel>Main</SectionLabel>
          <div className="mt-1.5 space-y-0.5">
            {mainItems.map((item) => (
              <NavItemLink key={item.href} item={item} active={pathname === item.href} />
            ))}
          </div>
        </div>

        <CollapsibleSection
          label="Growth"
          items={growthPrimaryItems}
          nestedTools={growthToolItems}
          pathname={pathname}
          defaultOpen
          badgeFor={withBadges}
        />

        <CollapsibleSection
          label="Finance"
          items={financeItems}
          pathname={pathname}
          badgeFor={withBadges}
        />

        <div className="space-y-0.5">
          <NavItemLink
            item={withBadges({ label: 'Notifications', href: '/creator/notifications', icon: Bell })}
            active={pathname === '/creator/notifications'}
          />
          <NavItemLink
            item={{ label: 'Settings', href: '/creator/settings', icon: Settings }}
            active={pathname === '/creator/settings'}
          />
        </div>
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
