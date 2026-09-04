import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Bookmark, BarChart3, Activity as ActivityIcon, CalendarDays } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';

interface EventRow {
  id: string;
  event_type: string;
  created_at: string;
  post: {
    id: string;
    title: string;
    creator: { username: string | null; display_name: string | null } | null;
  } | null;
}

const CustomerActivity = () => {
  const { user } = useAuth();
  const { appUserId, loading: userLoading } = useAppUser();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const [eventRes, savedRes] = await Promise.all([
        appUserId
          ? supabase
              .from('analytics_events')
              .select('id, event_type, created_at, post:posts(id, title, creator:creators(username, display_name))')
              .eq('user_id', appUserId)
              .order('created_at', { ascending: false })
              .limit(100)
          : Promise.resolve({ data: [] as EventRow[] }),
        user
          ? supabase.from('saved_posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
          : Promise.resolve({ count: 0 }),
      ]);

      if (cancelled) return;
      setEvents((eventRes.data as EventRow[] | null) ?? []);
      setSavedCount(('count' in savedRes ? savedRes.count : 0) ?? 0);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [appUserId, userLoading, user]);

  const stats = useMemo(() => {
    const views = events.filter((e) => e.event_type.includes('view'));
    const days = new Set(events.map((e) => e.created_at.slice(0, 10)));
    const activeDays = Math.max(days.size, 1);
    return [
      { label: 'Posts Viewed', value: String(views.length), icon: Eye },
      { label: 'Total Events', value: String(events.length), icon: ActivityIcon },
      { label: 'Saved Posts', value: String(savedCount), icon: Bookmark },
      { label: 'Avg / Active Day', value: (events.length / activeDays).toFixed(1), icon: BarChart3 },
    ];
  }, [events, savedCount]);

  const recent = events.filter((e) => e.post).slice(0, 25);

  return (
    <DashboardLayout type="member">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Activity</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your recent browsing and engagement history</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {loading
          ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[92px] rounded-xl" />)
          : stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
                <stat.icon className="h-3.5 w-3.5 text-muted-foreground mb-2" />
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{stat.label}</p>
              </div>
            ))}
      </div>

      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Recently Viewed</h2>

      {loading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : recent.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-sm font-medium mb-1">No activity yet</h3>
          <p className="text-xs text-muted-foreground">Browse the feed and your history will build up here.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          {recent.map((event, i) => {
            const post = event.post!;
            const name = post.creator?.display_name || post.creator?.username || 'Creator';
            const body = (
              <>
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-primary">{name[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{post.title}</p>
                  <p className="text-[10px] text-muted-foreground">{name}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDistanceToNowStrict(new Date(event.created_at), { addSuffix: true })}
                </span>
              </>
            );
            const className = `flex items-center gap-3 px-5 py-4 ${
              i < recent.length - 1 ? 'border-b border-border' : ''
            } hover:bg-muted/20 transition-colors`;

            return post.creator?.username ? (
              <Link key={event.id} to={`/${post.creator.username}`} className={className}>{body}</Link>
            ) : (
              <div key={event.id} className={className}>{body}</div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomerActivity;
