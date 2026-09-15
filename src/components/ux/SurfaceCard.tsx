import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

const surfaceClassName =
  'rounded-xl border border-border bg-card overflow-hidden card-shadow';

type SurfaceCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

/** Soft bordered surface using Prizelet card tokens (DubClub card grammar, not colors). */
export function SurfaceCard({ className, children, ...props }: SurfaceCardProps) {
  return (
    <div className={cn(surfaceClassName, className)} {...props}>
      {children}
    </div>
  );
}

export function SurfaceCardHeader({ className, children, ...props }: SurfaceCardProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 border-b border-border p-4', className)} {...props}>
      {children}
    </div>
  );
}

export function SurfaceCardBody({ className, children, ...props }: SurfaceCardProps) {
  return (
    <div className={cn('divide-y divide-border', className)} {...props}>
      {children}
    </div>
  );
}

export function SurfaceCardFooter({ className, children, ...props }: SurfaceCardProps) {
  return (
    <div className={cn('border-t border-border p-3', className)} {...props}>
      {children}
    </div>
  );
}
