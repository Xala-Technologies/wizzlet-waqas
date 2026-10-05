import { useMemo, useState } from 'react';
import { useAction, useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AdminPageHeader, adminSectionTitle } from '@/components/dashboard/AdminPageHeader';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { clayCard } from '@/lib/overviewClay';
import { kpiIconTone } from '@/lib/kpiIconTones';
import { DesktopTableRegion, MobileRecordCards } from '@/components/dashboard/MobileRecordList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Loader2, Search, Eye, Download, Shield, Inbox, Crown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { downloadCsv } from '@/lib/csv';
import { joinMetricsTruncationNote } from '@/lib/adminTruncation';
import { toast } from 'sonner';
import { format } from 'date-fns';

const PAGE_SIZE = 25;

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  created_at: number;
  subCount: number;
  role: string;
  roles: string[];
  totalSpend: number;
  creatorEarnings: number;
  paidOut: number;
  metricsTruncated: boolean;
}

const categoryLabel = (category: string) => {
  if (category === 'account_deletion') return 'Account deletion';
  if (category === 'email_change') return 'Email change';
  return category;
};

const AdminUsers = () => {
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [search, setSearch] = useState('');
  const [grantRole, setGrantRole] = useState<'admin' | 'moderator' | 'creator' | 'subscriber' | 'user'>('subscriber');
  const [granting, setGranting] = useState(false);

  const { results, status, loadMore } = usePaginatedQuery(
    api.admin.paginatedLists.listUsersPage,
    {},
    { initialNumItems: PAGE_SIZE },
  );
  const openRequests = useQuery(api.accountRequests.listOpenAdmin);
  const resolveRequest = useMutation(api.accountRequests.resolveAdmin);
  const cancelStripeSubs = useAction(api.payments.stripeNode.cancelStripeSubscriptionsAdmin);
  const grantRoleMutation = useMutation(api.roles.mutations.grantRole);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const loading = status === 'LoadingFirstPage';

  const users = useMemo((): UserRow[] => {
    return (results ?? []).map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.fullName,
      created_at: u.createdAt,
      subCount: u.subCount,
      role: u.role,
      roles: u.roles?.length ? u.roles : [u.role],
      totalSpend: u.totalSpend,
      creatorEarnings: u.creatorEarnings,
      paidOut: u.paidOut,
      metricsTruncated: u.metricsTruncated,
    }));
  }, [results]);

  const joinNote = joinMetricsTruncationNote(
    users.some((u) => u.metricsTruncated),
  );

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || (u.full_name?.toLowerCase().includes(q)) || u.email.toLowerCase().includes(q);
  });

  const roleLabel = (role: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      admin: { label: 'Admin', cls: 'bg-destructive/10 text-destructive' },
      creator: { label: 'Creator', cls: 'bg-purple-500/10 text-purple-400' },
      subscriber: { label: 'Subscriber', cls: 'bg-blue-500/10 text-blue-400' },
      user: { label: 'User', cls: 'bg-muted text-muted-foreground' },
      moderator: { label: 'Moderator', cls: 'bg-amber-500/10 text-amber-400' },
    };
    const r = map[role] ?? map.user!;
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium uppercase tracking-wide ${r.cls}`}>{r.label}</span>;
  };

  const rolePills = (roles: string[]) => (
    <div className="flex flex-wrap gap-1">
      {(roles.length > 0 ? roles : ['user']).map((role) => (
        <span key={role}>{roleLabel(role)}</span>
      ))}
    </div>
  );

  const handleExport = () => {
    if (filtered.length === 0) { toast.error('Nothing to export'); return; }
    downloadCsv(
      `users-${new Date().toISOString().split('T')[0]}.csv`,
      ['Name', 'Email', 'Roles', 'Active subscriptions', 'Total spend', 'Creator earnings', 'Paid out', 'Joined'],
      filtered.map((u) => [
        u.full_name ?? 'Unknown', u.email, u.roles.join('|'), u.subCount,
        u.totalSpend.toFixed(2), u.creatorEarnings.toFixed(2), u.paidOut.toFixed(2),
        format(new Date(u.created_at), 'yyyy-MM-dd'),
      ]),
    );
    toast.success(`Exported ${filtered.length} loaded accounts`);
  };

  const handleGrantRole = async () => {
    if (!selected) return;
    if (!window.confirm(`Grant role "${grantRole}" to ${selected.email}?`)) return;
    setGranting(true);
    try {
      await grantRoleMutation({
        userId: selected.id as Id<'users'>,
        role: grantRole,
      });
      toast.success(`Granted ${grantRole} to ${selected.email}`);
      const nextRoles = selected.roles.includes(grantRole)
        ? selected.roles
        : [...selected.roles, grantRole];
      setSelected({
        ...selected,
        roles: nextRoles,
        role: nextRoles.includes('admin')
          ? 'admin'
          : nextRoles.includes('creator')
            ? 'creator'
            : nextRoles[0] ?? grantRole,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to grant role');
    } finally {
      setGranting(false);
    }
  };

  const handleResolveRequest = async (
    requestId: Id<'accountRequests'>,
    disposition: 'fulfill' | 'reject',
    category: string,
  ) => {
    const label = categoryLabel(category).toLowerCase();
    const confirmMsg =
      disposition === 'fulfill'
        ? category === 'account_deletion'
          ? 'Fulfill deletion? This strips sign-in, roles, anonymizes the profile, and best-effort cancels Stripe subscriptions.'
          : `Fulfill ${label}? This updates the profile email (and password login id when present) and signs the user out.`
        : `Reject this ${label} request?`;
    if (!window.confirm(confirmMsg)) return;
    setResolvingId(requestId);
    try {
      const result = await resolveRequest({ requestId, disposition });
      if (
        result.status === 'fulfilled' &&
        result.category === 'account_deletion' &&
        result.stripeSubscriptionIds.length > 0
      ) {
        const cancel = await cancelStripeSubs({
          stripeSubscriptionIds: result.stripeSubscriptionIds,
          reason: `account_deletion:${requestId}`,
        });
        toast.success(
          `Account deletion fulfilled · Stripe cancel ${cancel.canceled + cancel.alreadyCanceled}/${cancel.attempted}`,
        );
      } else {
        toast.success(
          result.status === 'fulfilled'
            ? `${categoryLabel(result.category)} fulfilled`
            : `${categoryLabel(result.category)} rejected`,
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to resolve request';
      if (msg.includes('EMAIL_TAKEN')) toast.error('That email is already in use');
      else if (msg.includes('REQUEST_NOT_OPEN')) toast.error('Request is no longer open');
      else if (msg.includes('CANNOT_RESOLVE_OWN_REQUEST')) toast.error('Cannot resolve your own request');
      else toast.error(msg);
    } finally {
      setResolvingId(null);
    }
  };

  const userKpiItems = useMemo(() => {
    const adminCount = users.filter((u) => u.roles.includes('admin')).length;
    const creatorCount = users.filter((u) => u.roles.includes('creator')).length;
    return [
      {
        label: 'Loaded accounts',
        value: users.length.toString(),
        icon: Users,
        iconClassName: kpiIconTone.cyan,
      },
      {
        label: 'Open requests',
        value: openRequests === undefined ? '…' : openRequests.length.toString(),
        icon: Inbox,
        iconClassName: kpiIconTone.amber,
      },
      {
        label: 'Creators (loaded)',
        value: creatorCount.toString(),
        icon: Crown,
        iconClassName: kpiIconTone.violet,
      },
      {
        label: 'Admins (loaded)',
        value: adminCount.toString(),
        icon: Shield,
        iconClassName: kpiIconTone.rose,
      },
    ];
  }, [users, openRequests]);

  const headerActions = (
    <>
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search loaded users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 min-h-11"
        />
      </div>
      <Button variant="outline" size="sm" className="min-h-11 text-caption w-full sm:w-auto" onClick={handleExport}>
        <Download className="mr-1.5 h-3.5 w-3.5" /> Export
      </Button>
    </>
  );

  return (
    <DashboardLayout type="admin" mainClassName="bg-clay-page">
      <AdminPageHeader notice={joinNote} actions={headerActions} />

      {!loading && <DashboardKpiStrip items={userKpiItems} variant="clay" className="mb-6 sm:mb-8" />}

      <section className={cn(clayCard, 'mb-6 p-4 sm:p-6')}>
        <div className="mb-4 flex items-start gap-3">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              kpiIconTone.amber,
            )}
          >
            <Inbox className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className={adminSectionTitle}>Open account requests</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review queue — Fulfill applies email rotation or soft-deletion; Reject closes without
              changes.
            </p>
          </div>
          <span className="ml-auto shrink-0 text-caption font-medium tabular-nums text-muted-foreground">
            {openRequests === undefined ? '…' : `${openRequests.length} open`}
          </span>
        </div>
        {openRequests === undefined ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : openRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No open requests.</p>
        ) : (
          <ul className={cn(clayCard, 'divide-y divide-border overflow-hidden p-0')}>
            {openRequests.map((req) => (
              <li key={req._id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-3 py-3 bg-background/40">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {req.fullName ?? req.email ?? 'Unknown user'}
                  </p>
                  <p className="text-caption text-muted-foreground truncate">
                    {req.email ?? String(req.userId)}
                    {req.requestedEmail ? ` → ${req.requestedEmail}` : ''}
                  </p>
                  <p className="text-caption text-muted-foreground mt-0.5 line-clamp-2">{req.reason}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400">
                    {categoryLabel(req.category)}
                  </span>
                  <span className="text-caption text-muted-foreground">
                    {format(new Date(req.createdAt), 'MMM d, yyyy')}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8"
                    disabled={resolvingId === req._id}
                    onClick={() => void handleResolveRequest(req._id, 'reject', req.category)}
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8"
                    disabled={resolvingId === req._id}
                    onClick={() => void handleResolveRequest(req._id, 'fulfill', req.category)}
                  >
                    {resolvingId === req._id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      'Fulfill'
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className={cn(clayCard, 'p-10 text-center')}>
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">{search ? 'No matching users' : 'No users yet'}</h3>
        </div>
      ) : (
        <>
          <MobileRecordCards>
            {filtered.map((u) => (
              <li key={u.id} className={cn(clayCard, 'p-4')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.full_name ?? 'Unknown'}</p>
                    <p className="text-caption text-muted-foreground truncate mt-0.5">{u.email}</p>
                  </div>
                  {rolePills(u.roles)}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-caption">
                  <div><span className="text-muted-foreground">Subs</span><p className="font-medium mt-0.5">{u.subCount > 0 ? `${u.subCount} active` : 'None'}</p></div>
                  <div><span className="text-muted-foreground">Spend</span><p className="font-medium mt-0.5">{u.totalSpend > 0 ? `$${u.totalSpend.toFixed(2)}` : '—'}</p></div>
                  <div><span className="text-muted-foreground">Earnings</span><p className="font-medium mt-0.5 text-emerald-400">{u.creatorEarnings > 0 ? `$${u.creatorEarnings.toFixed(2)}` : '—'}</p></div>
                  <div><span className="text-muted-foreground">Joined</span><p className="font-medium mt-0.5">{format(new Date(u.created_at), 'MMM d, yyyy')}</p></div>
                </div>
                <Button variant="outline" size="sm" className="mt-3 h-11 w-full text-caption" onClick={() => setSelected(u)}>
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> View account
                </Button>
              </li>
            ))}
          </MobileRecordCards>

          <DesktopTableRegion label="Users table" className={cn(clayCard, 'overflow-hidden border-0 p-0')}>
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-caption font-medium text-muted-foreground p-4">User</th>
                  <th className="text-left text-caption font-medium text-muted-foreground p-4">Email</th>
                  <th className="text-left text-caption font-medium text-muted-foreground p-4">Roles</th>
                  <th className="text-left text-caption font-medium text-muted-foreground p-4">Subscriptions</th>
                  <th className="text-left text-caption font-medium text-muted-foreground p-4">Total Spend</th>
                  <th className="text-left text-caption font-medium text-muted-foreground p-4">Creator Earnings</th>
                  <th className="text-left text-caption font-medium text-muted-foreground p-4">Paid Out</th>
                  <th className="text-left text-caption font-medium text-muted-foreground p-4">Joined</th>
                  <th className="text-right text-caption font-medium text-muted-foreground p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium">{u.full_name ?? 'Unknown'}</td>
                    <td className="p-4 text-muted-foreground text-caption">{u.email}</td>
                    <td className="p-4">{rolePills(u.roles)}</td>
                    <td className="p-4">
                      {u.subCount > 0 ? (
                        <span className="text-sm font-medium">{u.subCount} active</span>
                      ) : (
                        <span className="text-caption text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="p-4 text-caption">{u.totalSpend > 0 ? `$${u.totalSpend.toFixed(2)}` : <span className="text-muted-foreground">—</span>}</td>
                    <td className="p-4 text-caption font-medium text-emerald-400">{u.creatorEarnings > 0 ? `$${u.creatorEarnings.toFixed(2)}` : <span className="text-muted-foreground font-normal">—</span>}</td>
                    <td className="p-4 text-caption">{u.paidOut > 0 ? `$${u.paidOut.toFixed(2)}` : <span className="text-muted-foreground">—</span>}</td>
                    <td className="p-4 text-caption text-muted-foreground">{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-9 w-9 px-0 text-caption" onClick={() => setSelected(u)} title="View account" aria-label="View account">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DesktopTableRegion>

          {(status === 'CanLoadMore' || status === 'LoadingMore') && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={status === 'LoadingMore'}
                onClick={() => loadMore(PAGE_SIZE)}
              >
                {status === 'LoadingMore' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Load more
              </Button>
            </div>
          )}
        </>
      )}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{selected?.full_name ?? 'Account'}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{selected.email}</span></div>
              <div className="flex justify-between items-start gap-3">
                <span className="text-muted-foreground shrink-0">Roles</span>
                {rolePills(selected.roles)}
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Joined</span><span>{format(new Date(selected.created_at), 'MMM d, yyyy')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Active subscriptions</span><span>{selected.subCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total spend</span><span>${selected.totalSpend.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Creator earnings</span><span className="text-emerald-400">${selected.creatorEarnings.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Paid out</span><span>${selected.paidOut.toFixed(2)}</span></div>
              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-caption font-medium text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Grant role
                </p>
                <div className="flex gap-2">
                  <Select value={grantRole} onValueChange={(v) => setGrantRole(v as typeof grantRole)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subscriber">Subscriber</SelectItem>
                      <SelectItem value="creator">Creator</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="h-9 shrink-0" disabled={granting} onClick={() => void handleGrantRole()}>
                    {granting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Grant'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminUsers;
