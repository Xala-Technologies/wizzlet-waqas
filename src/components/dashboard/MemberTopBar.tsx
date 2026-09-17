import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { Bell, ChevronDown, HelpCircle, LogOut, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * Member desktop utility bar — search, notifications, account menu.
 * Hidden on mobile (MobileTopBar + drawer handle that).
 */
export function MemberTopBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const me = useQuery(api.users.queries.me, user ? {} : 'skip');
  const notifUnread = useQuery(api.notifications.mutations.unreadCount, user ? {} : 'skip');

  const display =
    me?.fullName?.trim() ||
    me?.name?.trim() ||
    user?.email?.split('@')[0] ||
    'Member';
  const initial = display.charAt(0).toUpperCase() || 'M';
  const unread = notifUnread ?? 0;

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) {
      navigate('/dashboard/discover');
      return;
    }
    navigate(`/dashboard/discover?q=${encodeURIComponent(term)}`);
  };

  const handleSignOut = async () => {
    navigate('/');
    await signOut();
  };

  return (
    <header className="sticky top-0 z-20 hidden border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:block">
      <div className="mx-auto flex h-16 w-full min-w-0 max-w-[1600px] items-center gap-3 px-4 sm:px-6 md:px-8">
        <form onSubmit={onSearch} className="relative min-w-0 flex-1" role="search">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search creators, sports, or keywords..."
            aria-label="Search creators, sports, or keywords"
            className="h-10 rounded-full border-transparent bg-slate-100 pl-9 text-sm font-medium shadow-none placeholder:text-slate-400 focus-visible:bg-white"
          />
        </form>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 rounded-full border border-border bg-card"
          >
            <Link to="/dashboard/notifications" aria-label="Notifications">
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
                <Link to="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer gap-2">
                <Link to="/dashboard/subscriptions-billing">My Creators</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer gap-2">
                <Link to="/dashboard/results">My Bet Tracker</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer gap-2">
                <Link to="/dashboard/saved">Saved</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer gap-2">
                <Link to="/dashboard/activity">Activity</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer gap-2">
                <Link to="/support">
                  <HelpCircle className="h-4 w-4" aria-hidden />
                  Help & Support
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
