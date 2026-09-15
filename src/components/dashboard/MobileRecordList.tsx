import type { ReactNode } from 'react';

/** Phone-only stacked record list (use below `md`). */
export function MobileRecordCards({ children }: { children: ReactNode }) {
  return <ul className="md:hidden space-y-3">{children}</ul>;
}

/** Desktop table shell; hidden on phone when paired with MobileRecordCards. */
export function DesktopTableRegion({
  children,
  label,
  className = '',
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={`hidden md:block rounded-xl border border-border overflow-x-auto max-w-full ${className}`}
    >
      {children}
    </div>
  );
}
