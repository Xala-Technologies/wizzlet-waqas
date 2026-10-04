import { cn } from '@/lib/utils';

/** Five-step funnel: account → role → name → photo → bio. */
export const AUTH_FUNNEL_STEPS = 5;

export const AUTH_FUNNEL_LABELS = ['Account', 'Role', 'Name', 'Photo', 'Bio'] as const;

export function AuthWizardProgress({
  step,
  total = AUTH_FUNNEL_STEPS,
}: {
  step: number;
  total?: number;
}) {
  const current = Math.max(1, Math.min(total, step));
  const pct = (current / total) * 100;
  const label = AUTH_FUNNEL_LABELS[current - 1] ?? `Step ${current}`;

  return (
    <div className="mb-8 w-full">
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Step {current} of {total}
        </p>
        <p className="text-[13px] font-medium text-foreground">{label}</p>
      </div>
      <div
        className="h-1 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={`${label}, step ${current} of ${total}`}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="mt-3 hidden grid-cols-5 gap-1 sm:grid" aria-hidden>
        {AUTH_FUNNEL_LABELS.map((name, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          return (
            <li
              key={name}
              className={cn(
                'truncate text-center text-[10px] font-medium tracking-wide',
                active
                  ? 'text-foreground'
                  : done
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/50',
              )}
            >
              {name}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
