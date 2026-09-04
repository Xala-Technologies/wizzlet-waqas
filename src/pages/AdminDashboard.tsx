import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { Users, Crown, DollarSign, CreditCard, Loader2, TrendingUp, Activity, UserPlus, BarChart3, Wallet, Percent, AlertTriangle, FileWarning } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

const monthlyRevenue = [
  { month: 'Oct', revenue: 1200, fees: 120 },
  { month: 'Nov', revenue: 2800, fees: 280 },
  { month: 'Dec', revenue: 3400, fees: 340 },
  { month: 'Jan', revenue: 4100, fees: 410 },
  { month: 'Feb', revenue: 5200, fees: 520 },
  { month: 'Mar', revenue: 6800, fees: 680 },
];

const creatorGrowth = [
  { month: 'Oct', creators: 8, customers: 42 },
  { month: 'Nov', creators: 14, customers: 78 },
  { month: 'Dec', creators: 19, customers: 112 },
  { month: 'Jan', creators: 27, customers: 156 },
  { month: 'Feb', creators: 35, customers: 198 },
  { month: 'Mar', creators: 47, customers: 234 },
];

interface RecentSub {
  id: string;
  userName: string;
  creatorName: string;
  amount: number;
  created_at: string;
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [userCount, setUserCount] = useState(0);
  const [creatorCount, setCreatorCount] = useState(0);
  const [subCount, setSubCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [platformFees, setPlatformFees] = useState(0);
  const [mrr, setMrr] = useState(0);
  const [recentSubs, setRecentSubs] = useState<RecentSub[]>([]);
  const [recentCreators, setRecentCreators] = useState<{ name: string; date: string }[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<{ name: string; email: string; date: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const [usersRes, creatorsRes, subsRes, allSubsRes, recentCreatorsRes, recentUsersRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('creators').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('status, amount, platform_fee'),
        supabase.from('subscriptions').select('id, user_id, creator_id, amount, created_at, status').order('created_at', { ascending: false }).limit(6),
        supabase.from('creators').select('display_name, username, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('users').select('full_name, email, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      setUserCount(usersRes.count ?? 0);
      setCreatorCount(creatorsRes.count ?? 0);
      const subs = subsRes.data ?? [];
      const active = subs.filter(s => s.status === 'active');
      setSubCount(active.length);
      setTotalRevenue(active.reduce((a, b) => a + Number(b.amount), 0));
      setPlatformFees(active.reduce((a, b) => a + Number(b.platform_fee), 0));
      setMrr(active.reduce((a, b) => a + Number(b.amount), 0));

      setRecentCreators((recentCreatorsRes.data ?? []).map(c => ({
        name: c.display_name ?? `@${c.username ?? 'unknown'}`,
        date: c.created_at,
      })));

      setRecentCustomers((recentUsersRes.data ?? []).map(u => ({
        name: u.full_name ?? 'Unknown',
        email: u.email,
        date: u.created_at,
      })));

      const recent = allSubsRes.data ?? [];
      if (recent.length > 0) {
        const userIds = [...new Set(recent.map(s => s.user_id))];
        const creatorIds = [...new Set(recent.map(s => s.creator_id))];
        const [usersData, creatorsData] = await Promise.all([
          supabase.from('users').select('id, full_name, email').in('id', userIds),
          supabase.from('creators').select('id, display_name, username').in('id', creatorIds),
        ]);
        const userMap = new Map((usersData.data ?? []).map(u => [u.id, u]));
        const creatorMap = new Map((creatorsData.data ?? []).map(c => [c.id, c]));
        setRecentSubs(recent.map(s => {
          const u = userMap.get(s.user_id);
          const c = creatorMap.get(s.creator_id);
          return {
            id: s.id,
            userName: u?.full_name ?? u?.email ?? 'Unknown',
            creatorName: c?.display_name ?? `@${c?.username ?? 'unknown'}`,
            amount: Number(s.amount),
            created_at: s.created_at,
          };
        }));
      }

      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <DashboardLayout type="admin">
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  const availableBalance = platformFees * 0.85;
  const pendingBalance = platformFees * 0.15;

  const stats = [
    { label: 'Total Platform Revenue', value: `$${totalRevenue.toFixed(0)}`, icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Platform Fee Revenue', value: `$${platformFees.toFixed(0)}`, icon: Percent, color: 'text-purple-400' },
    { label: 'Available Balance', value: `$${availableBalance.toFixed(0)}`, icon: Wallet, color: 'text-emerald-400' },
    { label: 'Pending Balance', value: `$${pendingBalance.toFixed(0)}`, icon: BarChart3, color: 'text-amber-400' },
    { label: 'Paid Out Total', value: '$7,280', icon: TrendingUp, color: 'text-blue-400' },
    { label: 'Monthly Recurring', value: `$${mrr.toFixed(0)}`, icon: DollarSign, color: 'text-cyan-400' },
    { label: 'Total Creators', value: creatorCount.toString(), icon: Crown, color: 'text-purple-400' },
    { label: 'Total Customers', value: userCount.toString(), icon: Users, color: 'text-blue-400' },
    { label: 'Active Subscriptions', value: subCount.toString(), icon: CreditCard, color: 'text-emerald-400' },
    { label: 'Open Resolution Cases', value: '3', icon: FileWarning, color: 'text-destructive' },
  ];

  return (
    <DashboardLayout type="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Platform Overview</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Executive dashboard — monitor platform performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium mb-4">Monthly Revenue</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium mb-4">Monthly Platform Fees</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                <Area type="monotone" dataKey="fees" stroke="hsl(271, 81%, 56%)" fill="hsl(271, 81%, 56%, 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium mb-4">Creator Growth</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={creatorGrowth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                <Line type="monotone" dataKey="creators" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium mb-4">Customer Growth</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={creatorGrowth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                <Line type="monotone" dataKey="customers" stroke="hsl(180, 70%, 50%)" strokeWidth={2} dot={{ fill: 'hsl(180, 70%, 50%)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium">Recent Transactions</h2>
          </div>
          {recentSubs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
          ) : (
            <div className="space-y-1">
              {recentSubs.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <p className="text-xs truncate">
                      <span className="font-medium">{s.userName}</span>
                      <span className="text-muted-foreground"> → </span>
                      <span className="font-medium">{s.creatorName}</span>
                    </p>
                  </div>
                  <span className="text-xs font-medium text-emerald-400 shrink-0">${s.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-medium">Recent Creator Signups</h2>
          </div>
          {recentCreators.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No recent signups</p>
          ) : (
            <div className="space-y-1">
              {recentCreators.map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <Crown className="h-3 w-3 text-purple-400 shrink-0" />
                    <p className="text-xs font-medium truncate">{c.name}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{format(new Date(c.date), 'MMM d')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-medium">Recent Customer Signups</h2>
          </div>
          {recentCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No recent signups</p>
          ) : (
            <div className="space-y-1">
              {recentCustomers.map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="h-3 w-3 text-cyan-400 shrink-0" />
                    <p className="text-xs font-medium truncate">{c.name}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{format(new Date(c.date), 'MMM d')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
