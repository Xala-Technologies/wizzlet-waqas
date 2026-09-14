import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { createCheckoutSession } from '@/lib/stripe';
import { trackSubscribeClick } from '@/lib/analytics';
import { SurfaceCard } from '@/components/ux/SurfaceCard';

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
  const [promoCode, setPromoCode] = useState('');

  if (products.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="max-w-sm mx-auto space-y-1.5">
        <Label htmlFor="promo-code" className="text-caption text-muted-foreground">
          Promo code (optional)
        </Label>
        <Input
          id="promo-code"
          className="font-mono uppercase h-10"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          placeholder="WELCOME20"
          autoComplete="off"
        />
      </div>

      <div className={`grid gap-4 ${products.length === 1 ? 'max-w-sm mx-auto' : products.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        {products.map((product) => (
          <SurfaceCard
            key={product.id}
            className={`relative p-6 text-center transition-colors ${
              product.is_featured ? 'border-primary' : ''
            }`}
          >
            {product.is_featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-caption font-semibold text-primary-foreground uppercase tracking-wide">
                <Star className="h-3 w-3" /> Most Popular
              </span>
            )}

            <div className="mt-2">
              <span className="text-caption font-medium text-muted-foreground uppercase tracking-wide rounded-full bg-secondary px-2.5 py-0.5">
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
              variant={product.is_featured ? 'default' : 'outline'}
              className="w-full mt-5 min-h-11"
              onClick={() => {
                trackSubscribeClick(creatorId);
                void createCheckoutSession(
                  creatorId,
                  creatorUsername,
                  product.id,
                  promoCode.trim() || undefined,
                );
              }}
            >
              Subscribe
            </Button>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
};

export default PricingCards;
