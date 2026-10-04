import { cn } from '@/lib/utils';

/** Five-step funnel: account → role → name → photo → bio. */
export const AUTH_FUNNEL_STEPS = 5;

export const AUTH_FUNNEL_LABELS = ['Account', 'Role', 'Name', 'Photo', 'Bio'] as const;

function clampStep(step: number, total: number) {
  return Math.max(1, Math.min(total, step));
}

/** Form-column titles + segment bar. */
export function AuthWizardProgress({
  step,
  total = AUTH_FUNNEL_STEPS,
}: {
  step: number;
  total?: number;
}) {
  const current = clampStep(step, total);
  const label = AUTH_FUNNEL_LABELS[current - 1] ?? `Step ${current}`;
  const names = AUTH_FUNNEL_LABELS.slice(0, total);

  return (
    <div className="mb-9">
      <ol
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${names.length}, minmax(0, 1fr))` }}
        aria-label="Setup steps"
      >
        {names.map((name, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          return (
            <li
              key={name}
              className={cn(
                'min-w-0 truncate text-center text-[12px] font-medium tracking-tight',
                active && 'text-foreground',
                done && 'text-muted-foreground',
                !active && !done && 'text-muted-foreground/45',
              )}
              aria-current={active ? 'step' : undefined}
            >
              {name}
            </li>
          );
        })}
      </ol>
      <div
        className="mt-2.5 flex gap-1.5"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={`${label}, step ${current} of ${total}`}
      >
        {names.map((name, i) => (
          <span
            key={name}
            className={cn(
              'h-0.5 flex-1 rounded-full',
              i < current ? 'bg-primary' : 'bg-border',
            )}
          />
        ))}
      </div>
    </div>
  );
}
