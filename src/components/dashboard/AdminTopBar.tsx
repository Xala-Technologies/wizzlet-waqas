import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { Bell, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@convex/_generated/api';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { dashboardPageTitle } from '@/lib/dashboardPageTitle';

/**
 * Admin desktop utility bar — page title, theme, notifications, account.
 * Hidden on mobile (MobileTopBar + drawer handle that).
 */
export function AdminTopBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const me = useQuery(api.users.queries.me, user ? {} : 'skip');
  const notifUnread = useQuery(api.notifications.mutations.unreadCount, user ? {} : 'skip');

  const pageTitle = dashboardPageTitle('admin', location);
  const display =
    me?.fullName?.trim() ||
    me?.name?.trim() ||
    user?.email?.split('@')[0] ||
    'Admin';
  const initial = display.charAt(0).toUpperCase() || 'A';
  const unread = notifUnread ?? 0;

  const handleSignOut = async () => {
    navigate('/');
    await signOut();
  };

  return (
    <header className="sticky top-0 z-20 hidden border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:block">
      <div className="mx-auto flex h-[var(--topbar-height)] w-full min-w-0 max-w-[var(--content-max)] items-center gap-3 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {pageTitle}
        </h1>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle className="h-10 w-10 rounded-full border border-border bg-card" />

          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 rounded-full border border-border bg-card"
          >
            <Link to="/admin/notifications" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {unread > 0 ? (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
              ) : null}
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-2.5',
                'text-sm font-semibold text-foreground transition-colors hover:bg-muted/60',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
              aria-label="Account menu"
            >
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border border-border',
                  'bg-primary/15 text-xs font-bold text-primary',
                )}
                aria-hidden
              >
                {initial}
              </span>
              <span className="hidden max-w-[9rem] truncate sm:inline">{display}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-semibold text-foreground">{display}</p>
                {user?.email ? (
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                ) : null}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer gap-2">
                <Link to="/admin/settings">
                  <Settings className="h-4 w-4" aria-hidden />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-rose-600 focus:text-rose-600 dark:text-rose-400 dark:focus:text-rose-400"
                onSelect={() => void handleSignOut()}
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
