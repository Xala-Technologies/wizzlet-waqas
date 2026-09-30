import { Check, GripVertical, Info, Plus, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  formatProductPrice,
  type ProductBillingType,
} from '@/lib/creatorProductsDemo';
import { clayCard } from '@/lib/overviewClay';

/** Minimum visible card cells in the strip (filled + empty placeholders). */
const MIN_VISIBLE_SLOTS = 4;

export type DisplayedProductCard = {
  id: string;
  name: string;
  priceCents: number;
  billingPeriod: string;
  type: ProductBillingType;
  isFeatured: boolean;
  features: string[];
  Icon: LucideIcon;
  iconClassName: string;
};

export type DisplayedProductCandidate = {
  id: string;
  name: string;
  priceCents: number;
  billingPeriod: string;
  type: ProductBillingType;
  Icon: LucideIcon;
  iconClassName: string;
};

type DisplayedProductsSectionProps = {
  products: DisplayedProductCard[];
  /** Products not yet on the profile that can be added. */
  candidates?: DisplayedProductCandidate[];
  onRemove: (id: string) => void;
  onAdd?: (id: string) => void;
  addBusy?: boolean;
};

function EmptySlot({
  interactive,
  candidates,
  onAdd,
  addBusy,
}: {
  interactive: boolean;
  candidates: DisplayedProductCandidate[];
  onAdd?: (id: string) => void;
  addBusy: boolean;
}) {
  const body = (
    <>
      <span className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Plus className="h-4 w-4" aria-hidden />
      </span>
      <p className="text-xs font-bold text-foreground">Add product to profile</p>
      <p className="mt-1 max-w-[11rem] text-[11px] font-medium leading-snug text-muted-foreground">
        {interactive
          ? 'Pick a product, or use + in the table below.'
          : 'Choose from your product list below.'}
      </p>
    </>
  );

  const shellClass = cn(
    'flex min-h-[188px] flex-col items-center justify-center rounded-[var(--radius-clay)] border-2 border-dashed border-border bg-muted/20 px-3 py-5 text-center',
    interactive && 'transition hover:border-primary/40 hover:bg-primary/5',
  );

  if (!interactive || !onAdd || candidates.length === 0) {
    return (
      <div className={shellClass} aria-hidden={!interactive}>
        {body}
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" disabled={addBusy} className={shellClass}>
          {body}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        className="w-[280px] rounded-2xl border-border p-3 shadow-[var(--shadow-card)]"
      >
        <p className="mb-2 px-1 text-sm font-bold text-foreground">Add to profile</p>
        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {candidates.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                disabled={addBusy}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-muted/70 disabled:opacity-60"
                onClick={() => onAdd(c.id)}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    c.iconClassName,
                  )}
                >
                  <c.Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-foreground">
                    {c.name}
                  </span>
                  <span className="block text-xs font-semibold text-muted-foreground">
                    {formatProductPrice(c.priceCents, c.billingPeriod)}
                    {c.type === 'one-time' ? ' · One-time' : null}
                  </span>
                </span>
                <Plus className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function DisplayedProductsSection({
  products,
  candidates = [],
  onRemove,
  onAdd,
  addBusy = false,
}: DisplayedProductsSectionProps) {
  const used = products.length;
  const hasCandidates = candidates.length > 0;
  // Keep at least 4 compact cells so the strip never stretches one wide card.
  const emptyCount = Math.max(0, MIN_VISIBLE_SLOTS - used);
  // When over the minimum, still show one add cell if more products can be pinned.
  const trailingAdd = used >= MIN_VISIBLE_SLOTS && hasCandidates && Boolean(onAdd) ? 1 : 0;
  const placeholderCount = emptyCount + trailingAdd;

  return (
    <section className="mb-6 sm:mb-8">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
          Displayed Products
        </h2>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="About displayed products"
              >
                <Info className="h-4 w-4" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              Pin products to your public profile. Cards stay in a compact 4-across row and grow
              as you add more from the table or an empty slot.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <article
            key={product.id}
            className={cn(clayCard, 'relative flex flex-col p-3.5 sm:p-4')}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/70">
                <GripVertical className="h-3.5 w-3.5" aria-hidden />
              </span>
              {product.isFeatured ? (
                <span className="clay-chip inline-flex bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground dark:text-[#061426]">
                  Most Popular
                </span>
              ) : (
                <span className="h-4" />
              )}
            </div>

            <span
              className={cn(
                'mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg shadow-[inset_0_-2px_4px_rgba(8,24,47,0.06),inset_0_2px_4px_rgba(255,255,255,0.55)] dark:shadow-[inset_0_-2px_4px_rgba(0,0,0,0.28),inset_0_2px_4px_rgba(255,255,255,0.04)]',
                product.iconClassName,
              )}
            >
              <product.Icon className="h-4 w-4" aria-hidden />
            </span>

            <h3 className="text-sm font-bold tracking-tight text-foreground">{product.name}</h3>
            <p className="mt-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
              {formatProductPrice(product.priceCents, product.billingPeriod)}
            </p>

            <ul className="mt-3 flex-1 space-y-1.5">
              {product.features.slice(0, 3).map((feature) => (
                <li key={feature} className="flex items-start gap-1.5 text-xs text-foreground">
                  <Check
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  <span className="leading-snug">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 h-9 w-full gap-1.5 rounded-xl border-destructive/40 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onRemove(product.id)}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Remove from profile
            </Button>
          </article>
        ))}

        {Array.from({ length: placeholderCount }).map((_, i) => (
          <EmptySlot
            key={`empty-slot-${i}`}
            interactive={i === 0 && hasCandidates && Boolean(onAdd)}
            candidates={candidates}
            onAdd={onAdd}
            addBusy={addBusy}
          />
        ))}
      </div>
    </section>
  );
}
