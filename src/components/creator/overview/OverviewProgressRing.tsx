import { Link } from 'react-router-dom';

export function OverviewProgressRing({
  percent,
  title,
  detail,
  href,
  ctaLabel,
}: {
  percent: number;
  title: string;
  detail: string;
  href: string;
  ctaLabel: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-base font-extrabold tracking-tight text-foreground">Creator Progress</h2>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90" aria-hidden>
            <circle
              cx="44"
              cy="44"
              r={r}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            <circle
              cx="44"
              cy="44"
              r={r}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold tabular-nums text-foreground">
            {clamped}%
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-muted-foreground">{detail}</p>
          <Link
            to={href}
            className="mt-3 inline-flex text-xs font-bold text-primary hover:underline"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
