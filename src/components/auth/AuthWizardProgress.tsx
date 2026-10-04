import { cn } from '@/lib/utils';

/** Five-dot funnel chrome: account → role → name → photo → bio. */
export const AUTH_FUNNEL_STEPS = 5;

export function AuthWizardProgress({
  step,
  total = AUTH_FUNNEL_STEPS,
}: {
  step: number;
  total?: number;
}) {
  const current = Math.max(1, Math.min(total, step));
  return (
    <div
      className="mb-6 flex items-center justify-center gap-2"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={`Step ${current} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const filled = n <= current;
        return (
          <span
            key={n}
            className={cn(
              'h-2 w-2 rounded-full',
              filled ? 'bg-primary' : 'bg-border',
            )}
          />
        );
      })}
    </div>
  );
}
