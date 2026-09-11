import { Link } from 'react-router-dom';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DesktopTableRegion, MobileRecordCards } from '@/components/dashboard/MobileRecordList';
import { Button } from '@/components/ui/button';
import { Users, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const PAGE_SIZE = 25;

const CreatorSubscribers = () => {
  const creator = useQuery(api.creators.queries.myCreator);
  const { results: rows, status, loadMore } = usePaginatedQuery(
    api.subscriptions.mutations.listSubscribersDetailedPage,
    {},
    { initialNumItems: PAGE_SIZE },
  );

  const loading = status === 'LoadingFirstPage' || creator === undefined;
  const listComplete = status === 'Exhausted';
  const subscribers = (rows ?? []).map((s) => ({
    id: s._id,
    status: s.status,
    created_at: new Date(s.createdAt).toISOString(),
    user: s.user
      ? { email: s.user.email, full_name: s.user.fullName ?? null }
      : null,
  }));

  const activeOnPage = subscribers.filter((s) => s.status === 'active').length;
  const loadedCount = subscribers.length;
  const subtitle = listComplete
    ? `${activeOnPage} active · ${loadedCount} total`
    : `${activeOnPage} active on this page · ${loadedCount} loaded`;

  const profileReady = Boolean(creator?.username && creator.isPublished);
  const emptyCtaHref = profileReady
    ? `/c/${creator.username}`
    : creator
      ? '/creator/settings'
      : '/creator/onboarding';
  const emptyCtaLabel = profileReady ? 'View your profile' : 'Set up your profile';
  const emptyCopy = profileReady
    ? 'Share your profile link to attract subscribers.'
    : 'Finish and publish your creator profile so people can find and subscribe to you.';


  const statusBadge = (subStatus: string) =>
    subStatus === 'active' ? (
      <span className="inline-flex items-center gap-1.5 text-support font-medium text-emerald-400">
        <CheckCircle2 className="h-4 w-4 shrink-0" /> Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-support font-medium text-muted-foreground capitalize">
        <XCircle className="h-4 w-4 shrink-0" /> {subStatus}
      </span>
    );

  if (loading) {
    return (
      <DashboardLayout type="creator">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const loadMoreButton =
    status === 'CanLoadMore' || status === 'LoadingMore' ? (
      <div className="flex justify-center mt-4">
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={status === 'LoadingMore'}
          onClick={() => loadMore(PAGE_SIZE)}
        >
          {status === 'LoadingMore' ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : null}
          Load more
        </Button>
      </div>
    ) : null;

  return (
    <DashboardLayout type="creator">
      <header className="mb-6">
        <h1 className="text-heading font-bold text-foreground">Subscribers</h1>
        <p className="text-support text-muted-foreground mt-0.5">{subtitle}</p>
      </header>

      {subscribers.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-ui font-semibold text-foreground mb-2">No subscribers yet</h3>
          <p className="text-support text-muted-foreground max-w-xs mx-auto mb-5">
            {emptyCopy}
          </p>
          <Button asChild className="min-h-11">
            <Link to={emptyCtaHref}>{emptyCtaLabel}</Link>
          </Button>
        </div>
      ) : (
        <>
          <MobileRecordCards>
            {subscribers.map((sub) => (
              <li key={sub.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-ui font-medium text-foreground truncate">
                      {sub.user?.full_name || 'Unknown'}
                    </p>
                    <p className="text-support text-muted-foreground truncate mt-0.5">
                      {sub.user?.email}
                    </p>
                  </div>
                  {statusBadge(sub.status)}
                </div>
                <p className="text-support text-muted-foreground mt-3">
                  Joined {format(new Date(sub.created_at), 'MMM d, yyyy')}
                </p>
              </li>
            ))}
          </MobileRecordCards>

          <DesktopTableRegion label="Subscribers table">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-support font-medium text-muted-foreground p-4">
                    Subscriber
                  </th>
                  <th className="text-left text-support font-medium text-muted-foreground p-4">
                    Status
                  </th>
                  <th className="text-left text-support font-medium text-muted-foreground p-4">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4">
                      <p className="text-ui font-medium text-foreground">
                        {sub.user?.full_name || 'Unknown'}
                      </p>
                      <p className="text-support text-muted-foreground">{sub.user?.email}</p>
                    </td>
                    <td className="p-4">{statusBadge(sub.status)}</td>
                    <td className="p-4 text-support text-muted-foreground">
                      {format(new Date(sub.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DesktopTableRegion>

          {loadMoreButton}
        </>
      )}
    </DashboardLayout>
  );
};

export default CreatorSubscribers;
