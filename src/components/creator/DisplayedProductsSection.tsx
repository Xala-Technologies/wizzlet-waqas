import { Check, GripVertical, Info, Plus, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  PROFILE_DISPLAY_SLOT_LIMIT,
  formatProductPrice,
  type ProductBillingType,
} from '@/lib/creatorProductsDemo';

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

type DisplayedProductsSectionProps = {
  products: DisplayedProductCard[];
  onRemove: (id: string) => void;
};

export function DisplayedProductsSection({
  products,
  onRemove,
}: DisplayedProductsSectionProps) {
  const used = products.length;
  const emptySlots = Math.max(0, PROFILE_DISPLAY_SLOT_LIMIT - used);

  return (
    <section className="mb-6 sm:mb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
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
                Choose up to {PROFILE_DISPLAY_SLOT_LIMIT} products to show on your public
                profile. Members see these first when they visit your page.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm font-semibold tabular-nums text-muted-foreground">
          {used}/{PROFILE_DISPLAY_SLOT_LIMIT} slots used
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <article
            key={product.id}
            className="relative flex flex-col rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <span className="inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-lg text-muted-foreground/70">
                <GripVertical className="h-4 w-4" aria-hidden />
              </span>
              {product.isFeatured ? (
                <span className="inline-flex rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground">
                  Most Popular
                </span>
              ) : (
                <span className="h-5" />
              )}
            </div>

            <span
              className={cn(
                'mb-3 flex h-11 w-11 items-center justify-center rounded-xl',
                product.iconClassName,
              )}
            >
              <product.Icon className="h-5 w-5" aria-hidden />
            </span>

            <h3 className="text-base font-bold tracking-tight text-foreground">
              {product.name}
            </h3>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-muted-foreground">
              {formatProductPrice(product.priceCents, product.billingPeriod)}
            </p>

            <ul className="mt-4 flex-1 space-y-2">
              {product.features.slice(0, 4).map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
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
              className="mt-5 h-11 w-full gap-2 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onRemove(product.id)}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Remove from profile
            </Button>
          </article>
        ))}

        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-slot-${i}`}
            className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 px-5 py-8 text-center"
          >
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Plus className="h-6 w-6" aria-hidden />
            </span>
            <p className="text-sm font-bold text-foreground">Add product to profile</p>
            <p className="mt-1 max-w-[14rem] text-xs font-medium leading-relaxed text-muted-foreground">
              Choose from your product list below.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
