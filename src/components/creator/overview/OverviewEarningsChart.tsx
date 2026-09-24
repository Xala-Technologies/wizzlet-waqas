import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type EarningsBar = {
  label: string;
  valueCents: number;
};

export function OverviewEarningsChart({
  totalLabel,
  trendLabel,
  trendPositive,
  bars,
  rangeLabel = 'Last 6 months',
}: {
  totalLabel: string;
  trendLabel?: string;
  trendPositive?: boolean;
  bars: EarningsBar[];
  rangeLabel?: string;
}) {
  const hasData = bars.length > 0 && bars.some((b) => b.valueCents > 0);
  const chartData = bars.map((b) => ({
    month: b.label,
    revenue: Math.round(b.valueCents / 100),
  }));

  return (
    <section className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-foreground">Revenue</h2>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Net revenue from all products.
          </p>
        </div>
        <Select value="6m" disabled>
          <SelectTrigger
            className="h-8 w-[9.5rem] rounded-lg border-border bg-background text-xs font-semibold"
            aria-label={rangeLabel}
          >
            <SelectValue placeholder={rangeLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6m">{rangeLabel}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <p className="text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
          {totalLabel}
        </p>
        {trendLabel ? (
          <span
            className={
              trendPositive
                ? 'mb-1 text-xs font-bold text-emerald-600 dark:text-emerald-400'
                : 'mb-1 text-xs font-bold text-rose-600 dark:text-rose-400'
            }
          >
            {trendLabel}
          </span>
        ) : null}
      </div>

      {!hasData ? (
        <div className="mt-6 flex flex-1 items-center justify-center rounded-xl border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No payment history to chart yet.
          </p>
        </div>
      ) : (
        <div className="mt-4 min-h-[11rem] flex-1">
          <ResponsiveContainer width="100%" height={176}>
            <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="overviewRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/60" />
              <XAxis
                dataKey="month"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'hsl(var(--foreground))',
                }}
                formatter={(value: number) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fill="url(#overviewRevenueFill)"
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <Link
        to="/creator/earnings"
        className="mt-3 text-xs font-bold text-primary hover:underline"
      >
        View earnings details
      </Link>
    </section>
  );
}
