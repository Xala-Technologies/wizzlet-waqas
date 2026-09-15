import { Link } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Seo } from '@/components/Seo';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight } from 'lucide-react';

const creatorPoints = [
  'Sell products and gated content with built-in checkout',
  '5% platform fee for your first 30 days, then 10%',
  'No setup fees and no monthly minimum',
  'Payouts once Stripe Connect is complete',
];

const memberPoints = [
  'Pay creators directly for the products you want',
  'Cancel anytime from your member dashboard',
  'Access gated posts and messages after subscribe',
];

const Pricing = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <Seo
      title="Pricing — Prizelet for Creators"
      description="Transparent Prizelet pricing: a 5% intro platform fee for your first 30 days, then 10%. No setup fees, no monthly minimum."
      canonicalPath="/pricing"
    />
    <Navbar />
    <main id="main-content" className="container flex-1 pt-28 pb-20 md:pt-32">
      <p className="mb-4 text-caption font-medium uppercase tracking-[0.22em] text-primary">
        Prizelet · Pricing
      </p>
      <h1 className="max-w-2xl text-4xl font-extrabold tracking-[-0.04em] text-foreground sm:text-5xl">
        Simple, transparent pricing
      </h1>
      <p className="mt-4 max-w-xl text-ui leading-relaxed text-muted-foreground">
        Creators keep most of what they earn. Members only pay for the products they choose — no
        platform subscription for fans.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-primary/25 bg-card p-6 md:p-8">
          <p className="text-caption font-semibold uppercase tracking-widest text-primary">
            For creators
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Platform fee only
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            You set product prices. Prizelet takes a small cut of successful charges.
          </p>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-foreground">5%</span>
            <span className="text-sm text-muted-foreground">first 30 days</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Then <span className="font-semibold text-foreground">10%</span> ongoing. Stripe
            processing fees apply separately.
          </p>
          <ul className="mt-6 space-y-2.5">
            {creatorPoints.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link to="/signup" className="mt-8 inline-block">
            <Button variant="hero" className="gap-2">
              Apply for access <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </section>

        <section className="rounded-xl border border-border bg-card p-6 md:p-8">
          <p className="text-caption font-semibold uppercase tracking-widest text-muted-foreground">
            For members
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Pay creators, not a platform plan
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Browse Discover, open a profile, and subscribe to the product you want. Pricing is set
            by each creator.
          </p>
          <ul className="mt-6 space-y-2.5">
            {memberPoints.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link to="/discover" className="mt-8 inline-block">
            <Button variant="outline" className="gap-2">
              Discover creators <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </section>
      </div>
    </main>
    <Footer />
  </div>
);

export default Pricing;
