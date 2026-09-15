import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type LandingSectionVariant = 'default' | 'band' | 'hero';

interface LandingSectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  variant?: LandingSectionVariant;
  as?: ElementType;
}

const variantClass: Record<LandingSectionVariant, string> = {
  default: 'landing-section',
  band: 'landing-section-band',
  hero: 'relative min-h-[70vh] md:min-h-[min(92vh,52rem)] flex items-center pt-16 overflow-hidden',
};

/**
 * Owns vertical padding for landing page sections so adjacent seams stay
 * ~40–48px phone / 48–64px tablet / 64–80px desktop (total), not double py-24 stacks.
 */
export function LandingSection({
  children,
  className,
  id,
  variant = 'default',
  as: Tag = 'section',
}: LandingSectionProps) {
  return (
    <Tag id={id} className={cn(variantClass[variant], className)}>
      {children}
    </Tag>
  );
}
