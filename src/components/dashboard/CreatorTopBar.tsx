import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { Bell, ChevronDown, HelpCircle, LogOut, Plus, Search } from 'lucide-react';
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
 * Creator desktop utility bar — search, notifications, account menu, Create Post.
 * Hidden on mobile (MobileTopBar + drawer handle that).
 */
export function CreatorTopBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState('');
  const creator = useQuery(api.creators.queries.myCreator, user ? {} : 'skip');
  const notifUnread = useQuery(api.notifications.mutations.unreadCount, user ? {} : 'skip');

  const display =
    creator?.displayName?.trim() ||
    (creator?.username ? `@${creator.username}` : user?.email?.split('@')[0] || 'Creator');
  const initial = display.replace(/^@/, '').charAt(0).toUpperCase() || 'C';
  const unread = notifUnread ?? 0;
  const handle = creator?.username ? `@${creator.username}` : user?.email ?? null;
  const onPosts = location.pathname.startsWith('/creator/posts');
  const onProducts = location.pathname.startsWith('/creator/products');
  const onSubscribers = location.pathname.startsWith('/creator/subscribers');
  const onMessages = location.pathname.startsWith('/creator/messages');
  const onMarketing =
    location.pathname.startsWith('/creator/promo') ||
    location.pathname.startsWith('/creator/links') ||
    location.pathname.startsWith('/creator/referrals');
  const onReferrals = location.pathname.startsWith('/creator/referrals');
  const onEarnings =
    location.pathname.startsWith('/creator/earnings') ||
    location.pathname.startsWith('/creator/payouts') ||
    location.pathname.startsWith('/creator/transactions');
  const onTaxDocs =
    location.pathname.startsWith('/creator/earnings') && location.hash === '#tax-docs';
  const onSettings = location.pathname.startsWith('/creator/settings');
  const settingsTab = onSettings
    ? new URLSearchParams(location.search).get('tab') || 'general'
    : null;
  const searchPlaceholder = onPosts
    ? 'Search posts, tags, or content…'
    : onProducts
      ? 'Search products, subscribers, or anything…'
      : onSubscribers
        ? 'Search subscribers, email, or name…'
        : onMessages
          ? 'Search subscribers, messages, or anything…'
          : onReferrals
            ? 'Search referrals, users, or anything…'
            : onTaxDocs
              ? 'Search anything…'
              : onEarnings
                ? 'Search earnings, payouts, or transactions…'
                : settingsTab === 'team'
                  ? 'Search settings, members, or anything…'
                  : settingsTab === 'billing'
                    ? 'Search settings, billing, or anything…'
                    : settingsTab === 'integrations'
                      ? 'Search settings, integrations, or anything…'
                      : settingsTab === 'notifications'
                        ? 'Search settings, notifications, or anything…'
                        : settingsTab === 'security'
                          ? 'Search settings, security, or anything…'
                          : settingsTab === 'advanced'
                            ? 'Search settings, advanced options, or anything…'
                            : onSettings
                              ? 'Search settings, branding, or anything…'
                              : onMarketing
                                ? 'Search anything…'
                                : 'Search anything…';
  const hideCreatePost =
    onPosts ||
    onProducts ||
    onSubscribers ||
    onMessages ||
    onMarketing ||
    onEarnings ||
    onSettings;

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) {
      navigate('/creator/posts');
      return;
    }
    // Honest: no global search API — route to posts with a hint in the hash.
    navigate(`/creator/posts?q=${encodeURIComponent(term)}`);
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
            placeholder={searchPlaceholder}
            aria-label="Search creator tools"
            className="h-10 border-border bg-card pl-9 text-sm font-medium shadow-none"
          />
        </form>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 rounded-full border border-border bg-card"
          >
            <Link to="/creator/notifications" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {unread > 0 ? (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
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
              {creator?.avatarUrl ? (
                <img
                  src={creator.avatarUrl}
                  alt=""
                  className="h-7 w-7 rounded-full border border-border object-cover"
                />
              ) : (
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border border-border',
                    'bg-primary/15 text-xs font-bold text-primary',
                  )}
                  aria-hidden
                >
                  {initial}
                </span>
              )}
              <span className="hidden max-w-[9rem] truncate sm:inline">{display}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-semibold text-foreground">{display}</p>
                {handle ? (
                  <p className="truncate text-xs text-muted-foreground">{handle}</p>
                ) : null}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
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

          {!hideCreatePost ? (
            <Button asChild className="h-10 gap-1.5 rounded-xl px-4 font-semibold shadow-sm">
              <Link to="/creator/posts">
                <Plus className="h-4 w-4" aria-hidden />
                Create Post
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
