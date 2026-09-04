import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Get started for free',
    features: ['Public profile', 'Up to 50 subscribers', 'Basic analytics', 'Community support'],
    cta: 'Get Started',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    description: 'For serious creators',
    features: ['Unlimited subscribers', 'Advanced analytics', 'Custom branding', 'Priority support', 'Multiple tiers', 'Push notifications'],
    cta: 'Start Free Trial',
    featured: true,
  },
  {
    name: 'Business',
    price: '$99',
    period: '/mo',
    description: 'For teams and agencies',
    features: ['Everything in Pro', 'Team members', 'API access', 'White-label options', 'Dedicated support', 'Custom integrations'],
    cta: 'Contact Sales',
    featured: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-28">
      <div className="container">
        <div className="text-center mb-16">
          <p className="text-[12px] font-medium uppercase tracking-widest text-primary mb-3">Pricing</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Start free. Upgrade when you're ready.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-6 flex flex-col transition-all duration-300 ${
                plan.featured
                  ? 'border-primary/30 bg-card border-gradient'
                  : 'border-border bg-card/50 hover:border-border hover:bg-card'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-medium text-primary-foreground tracking-tight">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="font-semibold text-[15px] mb-1">{plan.name}</h3>
                <p className="text-[13px] text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-3xl font-bold tracking-tight">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground text-[13px]">{plan.period}</span>}
                </div>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-[13px]">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/signup">
                <Button
                  variant={plan.featured ? 'hero' : 'hero-outline'}
                  size="sm"
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
