import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { FileText, Download, Crown, Users, CreditCard, Percent, Wallet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Row = Record<string, string | number>;

interface ReportItem {
  key: string;
  title: string;
  description: string;
  icon: React.ElementType;
  build: () => Promise<Row[]>;
}

const money = (v: unknown) => Number(v ?? 0).toFixed(2);
const day = (v: unknown) => (v ? new Date(String(v)).toISOString().slice(0, 10) : '');

const toCsv = (rows: Row[]) => {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
};

const download = (name: string, csv: string) => {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

const AdminReports = () => {
  const [busy, setBusy] = useState<string | null>(null);
  const [recentExports, setRecentExports] = useState<{ name: string; date: string; size: string; csv: string }[]>([]);

  const reports: ReportItem[] = [
    {
      key: 'creators',
      title: 'Creators Report',
      description: 'Creators with subscriber counts, gross revenue, platform fees, and net earnings',
      icon: Crown,
      build: async () => {
        const [{ data: creators }, { data: subs }] = await Promise.all([
          supabase.from('creators').select('id, display_name, username, monthly_price, is_published, created_at'),
          supabase.from('subscriptions').select('creator_id, amount, platform_fee, creator_earnings, status'),
        ]);
        const active = (subs ?? []).filter(s => s.status === 'active');
        return (creators ?? []).map(c => {
          const mine = active.filter(s => s.creator_id === c.id);
          return {
            creator: c.display_name ?? '',
            username: c.username ?? '',
            published: c.is_published ? 'yes' : 'no',
            monthly_price: money(c.monthly_price),
            active_subscribers: mine.length,
            gross_revenue: money(mine.reduce((a, b) => a + Number(b.amount), 0)),
            platform_fees: money(mine.reduce((a, b) => a + Number(b.platform_fee), 0)),
            net_earnings: money(mine.reduce((a, b) => a + Number(b.creator_earnings), 0)),
            joined: day(c.created_at),
          };
        });
      },
    },
    {
      key: 'customers',
      title: 'Customers Report',
      description: 'Accounts with subscription counts, total spend, and signup dates',
      icon: Users,
      build: async () => {
        const [{ data: users }, { data: subs }] = await Promise.all([
          supabase.from('users').select('id, email, username, full_name, created_at'),
          supabase.from('subscriptions').select('user_id, amount, status'),
        ]);
        return (users ?? []).map(u => {
          const mine = (subs ?? []).filter(s => s.user_id === u.id);
          return {
            name: u.full_name ?? u.username ?? '',
            email: u.email,
            subscriptions: mine.length,
            active_subscriptions: mine.filter(s => s.status === 'active').length,
            total_spend: money(mine.reduce((a, b) => a + Number(b.amount), 0)),
            joined: day(u.created_at),
          };
        });
      },
    },
    {
      key: 'transactions',
      title: 'Transactions Report',
      description: 'Subscription ledger with amounts, fees, creator earnings, and status',
      icon: CreditCard,
      build: async () => {
        const [{ data: subs }, { data: creators }, { data: users }] = await Promise.all([
          supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
          supabase.from('creators').select('id, display_name, username'),
          supabase.from('users').select('id, email'),
        ]);
        const cMap = new Map((creators ?? []).map(c => [c.id, c.display_name ?? c.username ?? '']));
        const uMap = new Map((users ?? []).map(u => [u.id, u.email]));
        return (subs ?? []).map(s => ({
          date: day(s.created_at),
          creator: cMap.get(s.creator_id) ?? '',
          customer: uMap.get(s.user_id) ?? '',
          amount: money(s.amount),
          fee_percentage: Number(s.fee_percentage),
          platform_fee: money(s.platform_fee),
          creator_earnings: money(s.creator_earnings),
          status: s.status,
        }));
      },
    },
    {
      key: 'payouts',
      title: 'Payouts Report',
      description: 'Payout ledger with creator, amount, status, method, and processed date',
      icon: Wallet,
      build: async () => {
        const [{ data: payouts }, { data: creators }] = await Promise.all([
          supabase.from('payouts').select('*').order('created_at', { ascending: false }),
          supabase.from('creators').select('id, display_name, username'),
        ]);
        const cMap = new Map((creators ?? []).map(c => [c.id, c.display_name ?? c.username ?? '']));
        return (payouts ?? []).map(p => ({
          created: day(p.created_at),
          processed: day(p.processed_at),
          creator: cMap.get(p.creator_id) ?? '',
          amount: money(p.amount),
          status: p.status,
          method: p.method,
          reference: p.reference ?? '',
        }));
      },
    },
    {
      key: 'fees',
      title: 'Platform Fees Report',
      description: 'Fee revenue per creator, split by intro and standard rates',
      icon: Percent,
      build: async () => {
        const [{ data: subs }, { data: creators }] = await Promise.all([
          supabase.from('subscriptions').select('creator_id, platform_fee, fee_percentage, status'),
          supabase.from('creators').select('id, display_name, username'),
        ]);
        const active = (subs ?? []).filter(s => s.status === 'active');
        return (creators ?? [])
          .map(c => {
            const mine = active.filter(s => s.creator_id === c.id);
            return {
              creator: c.display_name ?? c.username ?? '',
              subscriptions: mine.length,
              intro_rate_subs: mine.filter(s => Number(s.fee_percentage) <= 5).length,
              standard_rate_subs: mine.filter(s => Number(s.fee_percentage) > 5).length,
              fees_collected: money(mine.reduce((a, b) => a + Number(b.platform_fee), 0)),
            };
          })
          .filter(r => r.subscriptions > 0);
      },
    },
  ];

  const handleExport = async (report: ReportItem) => {
    setBusy(report.key);
    try {
      const rows = await report.build();
      if (rows.length === 0) {
        toast.info('No data available for this report yet');
        return;
      }
      const csv = toCsv(rows);
      const name = `${report.key}_${new Date().toISOString().slice(0, 10)}.csv`;
      download(name, csv);
      setRecentExports(prev => [
        {
          name,
          date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          size: `${Math.max(1, Math.round(new Blob([csv]).size / 1024))} KB`,
          csv,
        },
        ...prev,
      ].slice(0, 8));
      toast.success(`${report.title} exported (${rows.length} rows)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <DashboardLayout type="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Reports &amp; Exports</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Generate live CSV exports straight from platform data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {reports.map(report => (
          <div key={report.key} className="rounded-xl border border-border bg-card p-6 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                <report.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{report.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-9 text-xs shrink-0" disabled={busy === report.key} onClick={() => handleExport(report)}>
              {busy === report.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Download className="mr-1.5 h-3.5 w-3.5" /> CSV</>}
            </Button>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Recent Exports
          </h2>
        </div>
        {recentExports.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No exports generated in this session</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">File Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Generated</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Size</th>
                  <th className="text-right text-xs font-medium text-muted-foreground p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentExports.map((file, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium text-xs">{file.name}</td>
                    <td className="p-4 text-xs text-muted-foreground">{file.date}</td>
                    <td className="p-4 text-xs text-muted-foreground">{file.size}</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => download(file.name, file.csv)}>
                        <Download className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
