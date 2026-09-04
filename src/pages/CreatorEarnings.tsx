import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { DollarSign, TrendingUp, CreditCard, Loader2, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const monthlyData = [
  { month: 'Oct', revenue: 120 },
  { month: 'Nov', revenue: 280 },
  { month: 'Dec', revenue: 340 },
  { month: 'Jan', revenue: 410 },
  { month: 'Feb', revenue: 520 },
  { month: 'Mar', revenue: 680 },
];

const CreatorEarnings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);
  const [netRevenue, setNetRevenue] = useState(0);
  const [perSub, setPerSub] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: userData } = await supabase.from('users').select('id').eq('auth_id', user.id).maybeSingle();
      if (!userData) { setLoading(false); return; }
      const { data: creator } = await supabase.from('creators').select('id, monthly_price, created_at').eq('user_id', userData.id).maybeSingle();
      if (!creator) { setLoading(false); return; }
      setPerSub(creator.monthly_price ?? 9.99);


      const { data: subs } = await supabase
        .from('subscriptions')
        .select('amount, platform_fee, creator_earnings')
        .eq('creator_id', creator.id)
        .eq('status', 'active');

      const rows = subs ?? [];
      const gross = rows.reduce((a, b) => a + Number(b.amount), 0);
      const fees = rows.reduce((a, b) => a + Number(b.platform_fee), 0);
      const net = rows.reduce((a, b) => a + Number(b.creator_earnings), 0);
      setTotalRevenue(gross);
      setPlatformFee(fees);
      setNetRevenue(net);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout type="creator">
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="creator">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Track your revenue and payments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-5">
          <DollarSign className="h-4 w-4 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Gross Revenue</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <TrendingUp className="h-4 w-4 text-blue-400 mb-2" />
          <p className="text-2xl font-bold">${netRevenue.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Net Revenue</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <CreditCard className="h-4 w-4 text-purple-400 mb-2" />
          <p className="text-2xl font-bold">${perSub.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Per Subscriber</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-medium mb-4">Monthly Revenue</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 30%, 18%)" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(220, 9%, 66%)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(220, 9%, 66%)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(220, 41%, 10%)', border: '1px solid hsl(220, 30%, 18%)', borderRadius: '8px', fontSize: 12 }}
                formatter={(value: number) => [`$${value}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="hsl(243, 75%, 59%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Payments */}
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Recent Payments</h2>
      <div className="space-y-2">
        {[
          { name: 'Subscription - Alex J.', amount: perSub, date: 'Mar 15' },
          { name: 'Subscription - Sarah K.', amount: perSub, date: 'Mar 12' },
          { name: 'Subscription - Mike C.', amount: perSub, date: 'Mar 8' },
        ].map((p, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.date}</p>
              </div>
            </div>
            <p className="text-sm font-bold text-emerald-400">+${p.amount.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default CreatorEarnings;
