import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, CreditCard, Receipt, TrendingUp, Plus } from 'lucide-react';
import DemoMemberShell from '@/components/demo/DemoMemberShell';
import { useDemoMemberStore } from '@/components/demo/demoMemberStore';
import CancelSubButton from '@/components/demo/CancelSubButton';

const DemoMemberSubscriptions = () => {
  const store = useDemoMemberStore();
  const { state, metrics } = store;

  const subs = state.subscribedCreatorIds
    .map(id => store.creatorById(id))
    .filter((c): c is NonNullable<typeof c> => !!c);

  const nextBilling = new Date();
  nextBilling.setDate(nextBilling.getDate() + 12);

  const invoices = subs.slice(0, 4).flatMap((c, i) =>
    [0, 1].map(m => ({
      id: `${c.id}-${m}`,
      creator: c.name,
      amount: c.price,
      date: new Date(Date.now() - (m * 30 + i) * 86400000),
    })),
  ).sort((a, b) => +b.date - +a.date);

  return (
    <DemoMemberShell title="Subscriptions & Billing" subtitle="Manage your creator subscriptions and payment history">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Active Subs', value: metrics.activeSubs, icon: Crown },
          { label: 'Monthly Spend', value: `$${metrics.monthlySpend.toFixed(2)}`, icon: CreditCard },
          { label: 'Annualised', value: `$${(metrics.monthlySpend * 12).toFixed(0)}`, icon: Receipt },
          { label: 'Units Won', value: `${metrics.unitsNet >= 0 ? '+' : ''}${metrics.unitsNet}u`, icon: TrendingUp },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <s.icon className="h-3.5 w-3.5 text-muted-foreground mb-2" />
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Active Subscriptions</h2>
      {subs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center mb-8">
          <p className="text-sm text-muted-foreground mb-3">No active subscriptions.</p>
          <Button size="sm" asChild><Link to="/demo/member/discover"><Plus className="mr-1.5 h-3.5 w-3.5" /> Find creators</Link></Button>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {subs.map(c => {
            const perf = metrics.byCreator.find(x => x.creator.id === c.id);
            return (
              <div key={c.id} className="rounded-xl border border-border bg-card p-5 flex flex-wrap items-center gap-4">
                <div className="h-11 w-11 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-base font-bold text-primary">{c.name[0]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    ${c.price}/mo · renews {format(nextBilling, 'MMM d')}
                    {perf ? ` · ${perf.picks} tracked picks (${perf.units >= 0 ? '+' : ''}${perf.units}u)` : ''}
                  </p>
                </div>
                <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">ACTIVE</Badge>
                <CancelSubButton creatorId={c.id} />
              </div>
            );
          })}
        </div>
      )}

      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Payment History</h2>
      {invoices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No payments yet.</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          {invoices.map((inv, i) => (
            <div key={inv.id} className={`flex items-center gap-3 px-5 py-3 text-xs ${i < invoices.length - 1 ? 'border-b border-border' : ''}`}>
              <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="flex-1 font-medium">{inv.creator}</span>
              <span className="text-muted-foreground">{format(inv.date, 'MMM d, yyyy')}</span>
              <span className="w-16 text-right font-medium">${inv.amount.toFixed(2)}</span>
              <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">PAID</Badge>
            </div>
          ))}
        </div>
      )}
    </DemoMemberShell>
  );
};

export default DemoMemberSubscriptions;
