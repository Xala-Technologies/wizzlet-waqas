import { Link } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Seo } from '@/components/Seo';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Mail, ArrowRight } from 'lucide-react';

const Support = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <Seo
      title="Support — Prizelet"
      description="Get help with Prizelet accounts, subscriptions, payouts, and creator setup."
      canonicalPath="/support"
    />
    <Navbar />
    <main id="main-content" className="container flex-1 pt-28 pb-20 md:pt-32">
      <p className="mb-4 text-caption font-medium uppercase tracking-[0.22em] text-primary">
        Prizelet · Support
      </p>
      <h1 className="max-w-2xl text-4xl font-extrabold tracking-[-0.04em] text-foreground sm:text-5xl">
        How can we help?
      </h1>
      <p className="mt-4 max-w-xl text-ui leading-relaxed text-muted-foreground">
        For account access, billing, payouts, or creator onboarding questions, email the team. We
        review messages manually.
      </p>

      <div className="mt-10 max-w-lg rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Email support</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Typical reply within one business day.
            </p>
            <a
              href="mailto:support@prizelet.com"
              className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
            >
              support@prizelet.com
            </a>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/discover">
          <Button variant="outline" className="gap-2">
            Browse creators <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link to="/">
          <Button variant="ghost">Back home</Button>
        </Link>
      </div>
    </main>
    <Footer />
  </div>
);

export default Support;
