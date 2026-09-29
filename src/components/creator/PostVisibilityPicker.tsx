import { Crown, Layers, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export type PostVisibilityMode = 'all' | 'premium' | 'products';

export type PostVisibilityProduct = {
  id: string;
  name: string;
  subscriberCount: number;
  /** Optional leading glyph / emoji for the product chip */
  iconLabel?: string;
};

type PostVisibilityPickerProps = {
  mode: PostVisibilityMode;
  onModeChange: (mode: PostVisibilityMode) => void;
  products: PostVisibilityProduct[];
  selectedProductIds: string[];
  onSelectedProductIdsChange: (ids: string[]) => void;
  /** Product id used for the “Premium only” shortcut (featured / Premium tier). */
  premiumProductId?: string | null;
  className?: string;
};

function productIcon(name: string, iconLabel?: string): string {
  if (iconLabel) return iconLabel;
  const n = name.toLowerCase();
  if (n.includes('crypto') || n.includes('bitcoin')) return '₿';
  if (n.includes('vip')) return '💎';
  if (n.includes('premium')) return '★';
  if (n.includes('daily') || n.includes('insight')) return '📈';
  return '📦';
}

export function PostVisibilityPicker({
  mode,
  onModeChange,
  products,
  selectedProductIds,
  onSelectedProductIdsChange,
  premiumProductId,
  className,
}: PostVisibilityPickerProps) {
  const selected = new Set(selectedProductIds);
  const showProductList = mode === 'products' || mode === 'premium';

  const toggleProduct = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedProductIdsChange([...next]);
  };

  const handleModeChange = (next: PostVisibilityMode) => {
    onModeChange(next);
    if (next === 'premium' && premiumProductId) {
      onSelectedProductIdsChange([premiumProductId]);
    }
    if (next === 'all') {
      onSelectedProductIdsChange([]);
    }
  };

  const options: Array<{
    value: PostVisibilityMode;
    label: string;
    description: string;
    icon: typeof Users;
  }> = [
    {
      value: 'all',
      label: 'All subscribers',
      description: 'Visible to everyone who subscribes to your page.',
      icon: Users,
    },
    {
      value: 'premium',
      label: 'Premium only',
      description: premiumProductId
        ? 'Only subscribers to your Premium product can see this post.'
        : 'Only paying subscribers can see this post.',
      icon: Crown,
    },
    {
      value: 'products',
      label: 'Specific product(s)',
      description: 'Choose one or more products.',
      icon: Layers,
    },
  ];

  return (
    <section className={cn('space-y-3', className)}>
      <div>
        <h2 className="text-ui font-semibold text-foreground">Post visibility</h2>
        <p className="mt-0.5 text-caption text-muted-foreground">
          Choose which product(s) can see this post.
        </p>
      </div>

      <RadioGroup
        value={mode}
        onValueChange={(v) => handleModeChange(v as PostVisibilityMode)}
        className="gap-2"
      >
        {options.map((opt) => {
          const active = mode === opt.value;
          const Icon = opt.icon;
          return (
            <label
              key={opt.value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors',
                active
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border bg-background hover:bg-muted/40',
              )}
            >
              <RadioGroupItem value={opt.value} className="mt-1" aria-label={opt.label} />
              <span
                className={cn(
                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{opt.label}</span>
                <span className="mt-0.5 block text-caption text-muted-foreground">
                  {opt.description}
                </span>
              </span>
            </label>
          );
        })}
      </RadioGroup>

      {showProductList ? (
        <div
          className={cn(
            'rounded-xl border border-border bg-background/60 p-3',
            mode === 'premium' && 'opacity-90',
          )}
        >
          <p className="mb-2 text-caption font-semibold text-muted-foreground">
            {mode === 'premium' ? 'Premium product' : 'Select product(s)'}
          </p>
          {products.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-caption text-muted-foreground">
              No active products yet. Create a product to target specific tiers.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {products.map((product) => {
                const checked = selected.has(product.id);
                const disabled = mode === 'premium' && product.id !== premiumProductId;
                return (
                  <li key={product.id}>
                    <label
                      className={cn(
                        'flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                        checked
                          ? 'border-primary/35 bg-primary/5'
                          : 'border-transparent hover:bg-muted/50',
                        disabled && 'cursor-not-allowed opacity-45',
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={disabled || mode === 'premium'}
                        onCheckedChange={() => {
                          if (mode === 'products') toggleProduct(product.id);
                        }}
                        aria-label={product.name}
                      />
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
                        {productIcon(product.name, product.iconLabel)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {product.name}
                        </span>
                        <span className="text-caption text-muted-foreground">
                          {product.subscriberCount.toLocaleString()}{' '}
                          {product.subscriberCount === 1 ? 'subscriber' : 'subscribers'}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          {mode === 'products' && products.length > 0 && selectedProductIds.length === 0 ? (
            <p className="mt-2 text-caption text-amber-700 dark:text-amber-300">
              Select at least one product, or switch to All subscribers.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
