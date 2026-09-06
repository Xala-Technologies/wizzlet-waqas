import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DesktopTableRegion, MobileRecordCards } from '@/components/dashboard/MobileRecordList';
import { Users, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const CreatorSubscribers = () => {
  const rows = useQuery(api.subscriptions.mutations.listSubscribersDetailed);

  const loading = rows === undefined;
  const subscribers = (rows ?? []).map((s) => ({
    id: s._id,
    status: s.status,
    created_at: new Date(s.createdAt).toISOString(),
    user: s.user
      ? { email: s.user.email, full_name: s.user.fullName ?? null }
      : null,
  }));

  const activeCount = subscribers.filter((s) => s.status === 'active').length;

  const statusBadge = (status: string) =>
    status === 'active' ? (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" /> Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <XCircle className="h-3.5 w-3.5" /> {status}
      </span>
    );

  return (
    <DashboardLayout type="creator">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Subscribers</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{activeCount} active · {subscribers.length} total</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : subscribers.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No subscribers yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Share your profile link to attract subscribers.
          </p>
        </div>
      ) : (
        <>
          <MobileRecordCards>
            {subscribers.map((sub) => (
              <li key={sub.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{sub.user?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{sub.user?.email}</p>
                  </div>
                  {statusBadge(sub.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Joined {format(new Date(sub.created_at), 'MMM d, yyyy')}
                </p>
              </li>
            ))}
          </MobileRecordCards>

          <DesktopTableRegion label="Subscribers table">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Subscriber</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Joined</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub) => (
                  <tr key={sub.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <p className="text-sm font-medium">{sub.user?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{sub.user?.email}</p>
                    </td>
                    <td className="p-4">{statusBadge(sub.status)}</td>
                    <td className="p-4 text-xs text-muted-foreground">{format(new Date(sub.created_at), 'MMM d, yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DesktopTableRegion>
        </>
      )}
    </DashboardLayout>
  );
};

export default CreatorSubscribers;
