import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Eye,
  Bookmark,
  BarChart3,
  Activity as ActivityIcon,
  CalendarDays,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@convex/_generated/api';

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
  const eventsRaw = useQuery(api.analytics.mutations.listMine, user ? {} : 'skip');
  const savedDetailed = useQuery(api.posts.queries.listSavedDetailed, user ? {} : 'skip');

  const loading = user ? eventsRaw === undefined || savedDetailed === undefined : false;

  const events: EventRow[] = useMemo(
    () =>
      (eventsRaw ?? []).map((e) => ({
        id: e._id,
        event_type: e.eventType,
        created_at: new Date(e.createdAt).toISOString(),
        post: e.post
          ? {
              id: e.post._id,
              title: e.post.title,
              creator: e.post.creator
                ? {
                    username: e.post.creator.username,
                    display_name: e.post.creator.displayName ?? null,
                  }
                : null,
            }
          : null,
      })),
    [eventsRaw],
  );

  const savedCount = savedDetailed?.length ?? 0;

  const stats = useMemo(() => {
    const views = events.filter((e) => e.event_type.includes('view'));
    const days = new Set(events.map((e) => e.created_at.slice(0, 10)));
    const activeDays = Math.max(days.size, 1);
    return [
      { label: 'Posts Viewed', value: String(views.length), icon: Eye },
      { label: 'Total Events', value: String(events.length), icon: ActivityIcon },
      { label: 'Saved Posts', value: String(savedCount), icon: Bookmark, href: '/dashboard/saved' as string | undefined },
      { label: 'Avg / Active Day', value: (events.length / activeDays).toFixed(1), icon: BarChart3 },
    ];
  }, [events, savedCount]);

  const recent = events.filter((e) => e.post).slice(0, 25);

  if (loading) {
    return (
      <DashboardLayout type="member">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="member">
      <header className="mb-6">
        <h1 className="text-heading font-bold text-foreground">My Activity</h1>
        <p className="text-support text-muted-foreground mt-0.5">
          Recent post views and engagement we recorded for your account
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
        {stats.map((stat) => {
          const card = (
            <>
              <div className="flex items-center gap-1.5 mb-1.5">
                <stat.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-support text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-ui font-bold leading-none text-foreground">{stat.value}</p>
            </>
          );
          const className = 'rounded-xl border border-border bg-card p-3 block';
          return stat.href ? (
            <Link
              key={stat.label}
              to={stat.href}
              className={`${className} transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
            >
              {card}
            </Link>
          ) : (
            <div key={stat.label} className={className}>
              {card}
            </div>
          );
        })}
      </div>

      <h2 className="text-support font-semibold text-muted-foreground mb-3">Recently viewed</h2>

      {recent.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-ui font-semibold text-foreground mb-2">No tracked views yet</h3>
          <p className="text-support text-muted-foreground mb-5 max-w-sm mx-auto">
            Open picks in your feed or creator profiles to build history here. This list only shows
            engagement we already recorded — we do not invent activity.
          </p>
          <Button className="min-h-11" asChild>
            <Link to="/dashboard">Go to Feed</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          {recent.map((event, i) => {
            const post = event.post!;
            const name = post.creator?.display_name || post.creator?.username || 'Creator';
            const body = (
              <>
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-caption font-bold text-primary">{name[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-ui font-medium text-foreground truncate">{post.title}</p>
                  <p className="text-support text-muted-foreground">{name}</p>
                </div>
                <span className="text-support text-muted-foreground shrink-0">
                  {formatDistanceToNowStrict(new Date(event.created_at), { addSuffix: true })}
                </span>
              </>
            );
            const className = `flex items-center gap-3 min-h-11 px-5 py-3 ${
              i < recent.length - 1 ? 'border-b border-border' : ''
            } hover:bg-muted/20 transition-colors`;

            return post.creator?.username ? (
              <Link key={event.id} to={`/${post.creator.username}`} className={className}>
                {body}
              </Link>
            ) : (
              <div key={event.id} className={className}>
                {body}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomerActivity;
