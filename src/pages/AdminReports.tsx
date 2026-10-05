import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  AdminPageHeader,
  adminSectionTitle,
} from '@/components/dashboard/AdminPageHeader';
import { clayCard } from '@/lib/overviewClay';
import { kpiIconTone, type KpiIconTone } from '@/lib/kpiIconTones';
import { Button } from '@/components/ui/button';
import { FileText, Download, Crown, Users, CreditCard, Percent, Wallet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ADMIN_SCAN_MAX_DOCS, scanTruncationNote } from '@/lib/adminTruncation';

type Row = Record<string, string | number>;

interface ReportItem {
  key: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconTone: (typeof kpiIconTone)[KpiIconTone];
  build: (source: ReportSource) => Row[];
}

type ReportSource = Awaited<ReturnType<typeof fetchReportSource>>;

async function fetchReportSource(convex: ReturnType<typeof useConvex>) {
  return convex.action(api.admin.exportReports.exportReportBundle, {});
}

const money = (cents: number) => (cents / 100).toFixed(2);
const day = (ms: number) => (ms ? new Date(ms).toISOString().slice(0, 10) : '');

const toCsv = (rows: Row[]) => {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]!);
  const escape = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h]!)).join(','))].join('\n');
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
  const convex = useConvex();
  const [busy, setBusy] = useState<string | null>(null);
  const [recentExports, setRecentExports] = useState<{ name: string; date: string; size: string; csv: string }[]>([]);

  const reports: ReportItem[] = [
    {
      key: 'creators',
      title: 'Creators Report',
      description: 'Creators with subscriber counts, gross revenue, platform fees, and net earnings',
      icon: Crown,
      iconTone: kpiIconTone.amber,
      build: (source) => {
        const active = source.subscriptions.filter((s) => s.status === 'active');
        return source.creators.map((c) => {
          const mine = active.filter((s) => s.creatorId === c._id);
          return {
            creator: c.displayName ?? '',
            username: c.username ?? '',
            published: c.isPublished ? 'yes' : 'no',
            monthly_price: money(c.monthlyPriceCents ?? 0),
            active_subscribers: mine.length,
            gross_revenue: money(mine.reduce((a, b) => a + b.amountCents, 0)),
            platform_fees: money(mine.reduce((a, b) => a + b.platformFeeCents, 0)),
            net_earnings: money(mine.reduce((a, b) => a + b.creatorEarningsCents, 0)),
            joined: day(c.createdAt),
          };
        });
      },
    },
    {
      key: 'customers',
      title: 'Customers Report',
      description: 'Accounts with subscription counts, total spend, and signup dates',
      icon: Users,
      iconTone: kpiIconTone.cyan,
      build: (source) =>
        source.users.map((u) => {
          const mine = source.subscriptions.filter((s) => s.userId === u._id);
          return {
            name: u.fullName ?? u.username ?? '',
            email: u.email ?? '',
            subscriptions: mine.length,
            active_subscriptions: mine.filter((s) => s.status === 'active').length,
            total_spend: money(mine.reduce((a, b) => a + b.amountCents, 0)),
            joined: day(u.createdAt ?? 0),
          };
        }),
    },
    {
      key: 'transactions',
      title: 'Transactions Report',
      description: 'Subscription ledger with amounts, fees, creator earnings, and status',
      icon: CreditCard,
      iconTone: kpiIconTone.violet,
      build: (source) => {
        const cMap = new Map(source.creators.map((c) => [c._id, c.displayName ?? c.username ?? '']));
        const uMap = new Map(source.users.map((u) => [u._id, u.email ?? '']));
        return [...source.subscriptions]
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((s) => ({
            date: day(s.createdAt),
            creator: cMap.get(s.creatorId) ?? '',
            customer: uMap.get(s.userId) ?? '',
            amount: money(s.amountCents),
            fee_percentage: s.feePercentage,
            platform_fee: money(s.platformFeeCents),
            creator_earnings: money(s.creatorEarningsCents),
            status: s.status,
          }));
      },
    },
    {
      key: 'payouts',
      title: 'Payouts Report',
      description: 'Payout ledger with creator, amount, status, method, and processed date',
      icon: Wallet,
      iconTone: kpiIconTone.emerald,
      build: (source) => {
        const cMap = new Map(source.creators.map((c) => [c._id, c.displayName ?? c.username ?? '']));
        return [...source.payouts]
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((p) => ({
            created: day(p.createdAt),
            processed: day(p.processedAt ?? 0),
            creator: cMap.get(p.creatorId) ?? '',
            amount: money(p.amountCents),
            status: p.status,
            method: p.method ?? '',
            reference: p.reference ?? '',
          }));
      },
    },
    {
      key: 'fees',
      title: 'Platform Fees Report',
      description: 'Fee revenue per creator, split by intro and standard rates',
      icon: Percent,
      iconTone: kpiIconTone.sky,
      build: (source) => {
        const active = source.subscriptions.filter((s) => s.status === 'active');
        return source.creators
          .map((c) => {
            const mine = active.filter((s) => s.creatorId === c._id);
            return {
              creator: c.displayName ?? c.username ?? '',
              subscriptions: mine.length,
              intro_rate_subs: mine.filter((s) => s.feePercentage <= 5).length,
              standard_rate_subs: mine.filter((s) => s.feePercentage > 5).length,
              fees_collected: money(mine.reduce((a, b) => a + b.platformFeeCents, 0)),
            };
          })
          .filter((r) => r.subscriptions > 0);
      },
    },
  ];

  const handleExport = async (report: ReportItem) => {
    setBusy(report.key);
    try {
      const source = await fetchReportSource(convex);
      const rows = report.build(source);
      if (rows.length === 0) {
        toast.info('No data available for this report yet');
        return;
      }
      const csv = toCsv(rows);
      const name = `${report.key}_${new Date().toISOString().slice(0, 10)}.csv`;
      download(name, csv);
      setRecentExports((prev) => [
        {
          name,
          date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          size: `${Math.max(1, Math.round(new Blob([csv]).size / 1024))} KB`,
          csv,
        },
        ...prev,
      ].slice(0, 8));
      const note = source.truncated
        ? ` — capped at ${source.listLimit.toLocaleString()} rows/table`
        : '';
      toast.success(`${report.title} exported (${rows.length} rows)${note}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setBusy(null);
    }
  };

  const capNote = scanTruncationNote(true, ADMIN_SCAN_MAX_DOCS);

  return (
    <DashboardLayout type="admin" mainClassName="bg-clay-page">
      <AdminPageHeader
        notice={
          capNote ??
          `Exports include up to ${ADMIN_SCAN_MAX_DOCS.toLocaleString()} newest rows per source table.`
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 sm:mb-8">
        {reports.map((report) => (
          <div
            key={report.key}
            className={cn(clayCard, 'flex items-start justify-between gap-4 p-4 sm:p-6')}
          >
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                  report.iconTone,
                )}
              >
                <report.icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{report.title}</p>
                <p className="mt-1 text-caption text-muted-foreground">{report.description}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 shrink-0 text-caption"
              disabled={busy === report.key}
              onClick={() => handleExport(report)}
            >
              {busy === report.key ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
                </>
              )}
            </Button>
          </div>
        ))}
      </div>

      <section className={cn(clayCard, 'overflow-hidden')}>
        <div className="flex items-center gap-3 border-b border-border px-4 py-4 sm:px-6">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              kpiIconTone.teal,
            )}
          >
            <FileText className="h-5 w-5" aria-hidden />
          </div>
          <h2 className={adminSectionTitle}>Recent exports</h2>
        </div>
        {recentExports.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No exports generated in this session
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-4 text-left text-caption font-medium text-muted-foreground">
                    File name
                  </th>
                  <th className="p-4 text-left text-caption font-medium text-muted-foreground">
                    Generated
                  </th>
                  <th className="p-4 text-left text-caption font-medium text-muted-foreground">
                    Size
                  </th>
                  <th className="p-4 text-right text-caption font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentExports.map((file, i) => (
                  <tr
                    key={i}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/20"
                  >
                    <td className="p-4 text-caption font-medium">{file.name}</td>
                    <td className="p-4 text-caption text-muted-foreground">{file.date}</td>
                    <td className="p-4 text-caption text-muted-foreground">{file.size}</td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-caption"
                        onClick={() => download(file.name, file.csv)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};

export default AdminReports;
