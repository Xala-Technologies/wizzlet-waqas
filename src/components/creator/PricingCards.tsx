import { Button } from '@/components/ui/button';
import { Star, Check } from 'lucide-react';
import { createCheckoutSession } from '@/lib/stripe';
import { trackSubscribeClick } from '@/lib/analytics';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_period: string;
  is_featured: boolean;
}

interface PricingCardsProps {
  products: Product[];
  creatorId: string;
  creatorUsername: string;
}

const PERIOD_LABELS: Record<string, string> = {
  weekly: '/wk',
  monthly: '/mo',
  yearly: '/yr',
};

const PricingCards = ({ products, creatorId, creatorUsername }: PricingCardsProps) => {
  if (products.length === 0) return null;

  return (
    <div className={`grid gap-4 ${products.length === 1 ? 'max-w-sm mx-auto' : products.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
      {products.map((product) => (
        <div
          key={product.id}
          className={`rounded-2xl border bg-card p-6 text-center transition-all ${
            product.is_featured
              ? 'border-primary/40 ring-2 ring-primary/20 shadow-lg relative'
              : 'border-border'
          }`}
        >
          {product.is_featured && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground uppercase tracking-wide">
              <Star className="h-3 w-3" /> Most Popular
            </span>
          )}

          <div className="mt-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide rounded-full bg-secondary px-2.5 py-0.5">
              {product.billing_period}
            </span>
          </div>

          <h3 className="font-bold text-lg mt-3 mb-1">{product.name}</h3>

          {product.description && (
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {product.description}
            </p>
          )}

          <p className="text-3xl font-bold mb-1">
            ${product.price.toFixed(2)}
            <span className="text-sm font-normal text-muted-foreground">
              {PERIOD_LABELS[product.billing_period]}
            </span>
          </p>

          <Button
            variant={product.is_featured ? 'hero' : 'outline'}
            className="w-full mt-5 h-11"
            onClick={() => {
              trackSubscribeClick(creatorId);
              createCheckoutSession(creatorId, creatorUsername, product.id);
            }}
          >
            Subscribe
          </Button>
        </div>
      ))}
    </div>
  );
};

export default PricingCards;
