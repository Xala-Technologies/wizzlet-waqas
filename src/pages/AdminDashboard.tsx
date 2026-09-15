import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { scanTruncationNote } from '@/lib/adminTruncation';
import { Users, Crown, DollarSign, CreditCard, Loader2, TrendingUp, Activity, UserPlus, Percent, FileWarning, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

const AdminDashboardInner = () => {
  const stats = useQuery(api.admin.queries.dashboardStats);

  if (stats === undefined) {
    return (
      <DashboardLayout type="admin">
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  const truncation = scanTruncationNote(stats.truncated, stats.listLimit);

  const kpi = [
    { label: 'Active sub volume (MRR)', value: `$${(stats.totalRevenueCents / 100).toFixed(0)}`, icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Platform fee revenue', value: `$${(stats.platformFeesCents / 100).toFixed(0)}`, icon: Percent, color: 'text-purple-400' },
    { label: 'Creator paid out', value: `$${(stats.paidOutCents / 100).toFixed(0)}`, icon: TrendingUp, color: 'text-blue-400' },
    { label: 'Creators', value: stats.creatorCount.toString(), icon: Crown, color: 'text-purple-400' },
    { label: 'Accounts', value: stats.userCount.toString(), icon: Users, color: 'text-blue-400' },
    { label: 'Active subscriptions', value: stats.activeSubscriptionCount.toString(), icon: CreditCard, color: 'text-emerald-400' },
    { label: 'Open resolution cases', value: stats.openCases.toString(), icon: FileWarning, color: 'text-destructive' },
  ];

  const monthlyRevenue = stats.monthly;
  const creatorGrowth = stats.monthly;

  return (
    <DashboardLayout type="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Platform Overview</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Executive dashboard — live Convex aggregates</p>
        {truncation && (
          <p className="text-amber-600 text-caption mt-2">{truncation}</p>
        )}
        <p className="text-muted-foreground text-caption mt-1">
          Fee revenue and paid-out come from subscription and payout records. See Finance for detail — these are not Stripe cash balances.
        </p>
      </div>

      {(stats.openCases > 0 || stats.activeSubscriptionCount > 0 || stats.creatorCount > 0) && (
        <div className="rounded-xl border border-border bg-card p-4 mb-6">
          <h2 className="text-caption font-medium text-muted-foreground uppercase tracking-wider mb-3">Next up</h2>
          <ul className="space-y-2 text-sm">
            {stats.openCases > 0 && (
              <li>
                <Link to="/admin/resolution-cases" className="text-primary hover:underline inline-flex items-center gap-1">
                  {stats.openCases} open resolution case{stats.openCases === 1 ? '' : 's'} <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            )}
            <li>
              <Link to="/admin/alerts" className="text-primary hover:underline inline-flex items-center gap-1">
                Review ops alerts <ArrowRight className="h-3 w-3" />
              </Link>
            </li>
            <li>
              <Link to="/admin/payouts" className="text-primary hover:underline inline-flex items-center gap-1">
                Review payout ledger <ArrowRight className="h-3 w-3" />
              </Link>
            </li>
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpi.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-caption text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 min-w-0">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 min-w-0">
          <h2 className="text-sm font-medium mb-4">Monthly Revenue</h2>
          <div className="h-56 min-w-0 w-full">
            {monthlyRevenue.length === 0 ? (
              <p className="text-sm text-muted-foreground py-16 text-center">No subscription data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 14 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 14 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 14, color: 'hsl(var(--foreground))' }} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 min-w-0">
          <h2 className="text-sm font-medium mb-4">Monthly Platform Fees</h2>
          <div className="h-56 min-w-0 w-full">
            {monthlyRevenue.length === 0 ? (
              <p className="text-sm text-muted-foreground py-16 text-center">No fee data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 14 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 14 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 14, color: 'hsl(var(--foreground))' }} />
                  <Area type="monotone" dataKey="fees" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 min-w-0">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 min-w-0">
          <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><Activity className="h-4 w-4" /> Creator & customer growth</h2>
          <div className="h-56 min-w-0 w-full">
            {creatorGrowth.length === 0 ? (
              <p className="text-sm text-muted-foreground py-16 text-center">No growth data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={creatorGrowth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 14 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 14 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 14, color: 'hsl(var(--foreground))' }} />
                  <Line type="monotone" dataKey="creators" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="customers" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Recent subscriptions</h2>
          {stats.recentSubs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8">No subscriptions yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.recentSubs.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{s.userName}</p>
                    <p className="text-caption text-muted-foreground">{s.creatorName} · {format(s.createdAt, 'MMM d, yyyy')}</p>
                  </div>
                  <span className="font-semibold">${(s.amountCents / 100).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><UserPlus className="h-4 w-4" /> Recent creators</h2>
          {stats.recentCreators.length === 0 ? (
            <p className="text-sm text-muted-foreground">None yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.recentCreators.map((c, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span>{c.name}</span>
                  <span className="text-muted-foreground">{format(c.date, 'MMM d')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><Users className="h-4 w-4" /> Recent customers</h2>
          {stats.recentCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground">None yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.recentCustomers.map((u, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <div>
                    <p>{u.name}</p>
                    <p className="text-caption text-muted-foreground">{u.email}</p>
                  </div>
                  <span className="text-muted-foreground">{format(u.date, 'MMM d')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

const AdminDashboard = () => <AdminDashboardInner />;

export default AdminDashboard;
