import { Navbar } from '@/components/landing/Navbar';
import { Seo } from '@/components/Seo';
import { Footer } from '@/components/landing/Footer';
import { Shield, Users, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const pillars = [
  {
    icon: Shield,
    title: 'Verified Creators Only',
    description: 'Every creator on the platform is manually reviewed. No spam, no noise — only proven experts with real track records.',
  },
  {
    icon: Users,
    title: 'Direct Creator–Subscriber Model',
    description: 'Subscribers connect directly with creators they trust. No algorithm interference, no buried content. Pure signal.',
  },
  {
    icon: Zap,
    title: 'Built for Monetization',
    description: 'The infrastructure handles payments, subscriptions, and content gating — so creators focus on what they do best.',
  },
];

const Network = () => (
  <div className="min-h-screen bg-background">
    <Seo title={'The Wizzlet Network — Built for Proven Creators'} description={'Inside the Wizzlet private network: verified performance, subscription tooling, and payouts built for serious sports creators.'} />
      <Navbar />
    <main id="main-content" className="container pt-32 pb-20 max-w-3xl">
      <p className="text-xs font-medium uppercase tracking-widest text-primary mb-4">The Network</p>
      <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
        A private infrastructure for creators who deliver.
      </h1>
      <p className="text-muted-foreground text-lg leading-relaxed mb-16">
        Wizzlet isn't a public feed. It's a closed system designed for serious creators
        and the subscribers who value their expertise. Every interaction is intentional.
      </p>

      <div className="space-y-8 mb-16">
        {pillars.map((p) => (
          <div key={p.title} className="flex gap-5 items-start">
            <div className="shrink-0 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5">
              <p.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground mb-1">{p.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Ready to join the network?</h2>
        <p className="text-sm text-muted-foreground mb-6">Applications are reviewed manually. Only qualified creators are accepted.</p>
        <Link to="/signup">
          <Button variant="default" className="gap-2">
            Apply for Access <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </main>
    <Footer />
  </div>
);

export default Network;
