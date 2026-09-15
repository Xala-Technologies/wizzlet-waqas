import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { Bell, Plus, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Creator desktop utility bar — search, notifications, identity, New Pick CTA.
 * Hidden on mobile (MobileTopBar handles that).
 */
export function CreatorTopBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const creator = useQuery(api.creators.queries.myCreator, user ? {} : 'skip');
  const notifUnread = useQuery(api.notifications.mutations.unreadCount, user ? {} : 'skip');

  const display =
    creator?.displayName?.trim() ||
    (creator?.username ? `@${creator.username}` : user?.email?.split('@')[0] || 'Creator');
  const initial = display.replace(/^@/, '').charAt(0).toUpperCase() || 'C';
  const unread = notifUnread ?? 0;

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
            placeholder="Search anything…"
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

          <div className="hidden items-center gap-2 sm:flex">
            {creator?.avatarUrl ? (
              <img
                src={creator.avatarUrl}
                alt=""
                className="h-9 w-9 rounded-full border border-border object-cover"
              />
            ) : (
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border border-border',
                  'bg-primary/15 text-sm font-bold text-primary',
                )}
                aria-hidden
              >
                {initial}
              </div>
            )}
            <span className="max-w-[9rem] truncate text-sm font-semibold text-foreground">
              {display}
            </span>
          </div>

          <Button asChild className="h-10 gap-1.5 rounded-xl px-4 font-semibold">
            <Link to="/creator/posts">
              <Plus className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">New Pick</span>
              <span className="sm:hidden">Pick</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
