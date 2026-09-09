import { CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Sender-side receipt: shown on your own bubbles when the other party has read them. */
export function MessageSeenReceipt({
  seen,
  light = false,
  className,
}: {
  seen: boolean;
  /** Use on primary-colored bubbles */
  light?: boolean;
  className?: string;
}) {
  if (!seen) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-0.5 text-caption',
          light ? 'text-primary-foreground/50' : 'text-muted-foreground/70',
          className,
        )}
      >
        Sent
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-caption font-medium',
        light ? 'text-primary-foreground/80' : 'text-primary',
        className,
      )}
    >
      <CheckCheck className="h-3 w-3" />
      Seen
    </span>
  );
}
