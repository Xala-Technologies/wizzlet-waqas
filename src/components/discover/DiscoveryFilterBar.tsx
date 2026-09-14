import { useRef, type ComponentType, type SVGProps } from 'react';
import { ChevronRight } from 'lucide-react';
import { filterBarItemClassName, filterBarTrackClassName } from '@/lib/segmentedControl';
import { cn } from '@/lib/utils';

type Icon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

export type DiscoveryFilterOption<T extends string> = {
  key: T;
  label: string;
  icon: Icon;
};

type DiscoveryFilterBarProps<T extends string> = {
  options: DiscoveryFilterOption<T>[];
  value: T;
  onChange: (key: T) => void;
  'aria-label'?: string;
  className?: string;
};

/**
 * DubClub-style filter row: icon pills + circular scroll chevron.
 */
export function DiscoveryFilterBar<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel = 'Filters',
  className,
}: DiscoveryFilterBarProps<T>) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        ref={scrollerRef}
        className={filterBarTrackClassName}
        role="group"
        aria-label={ariaLabel}
      >
        {options.map((o) => {
          const active = value === o.key;
          const Icon = o.icon;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onChange(o.key)}
              aria-pressed={active}
              className={filterBarItemClassName(active)}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {o.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        aria-label="Scroll filters"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-foreground/35 hover:bg-muted"
        onClick={() => {
          scrollerRef.current?.scrollBy({ left: 180, behavior: 'smooth' });
        }}
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
