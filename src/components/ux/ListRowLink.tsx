import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ListRowLinkProps = {
  to: string;
  title: string;
  meta?: ReactNode;
  className?: string;
  showChevron?: boolean;
};

/** Clickable list row: title + muted meta + chevron. Prizelet tokens only. */
export function ListRowLink({
  to,
  title,
  meta,
  className,
  showChevron = true,
}: ListRowLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex min-h-11 items-center gap-3 px-4 py-3 text-left transition-colors',
        'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        className,
      )}
    >
      <span className="min-w-0 flex-1 truncate text-ui text-foreground">{title}</span>
      {meta != null ? (
        <span className="shrink-0 text-support text-muted-foreground">{meta}</span>
      ) : null}
      {showChevron ? (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      ) : null}
    </Link>
  );
}
