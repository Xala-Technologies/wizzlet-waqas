import { Lock, CreditCard, Globe } from 'lucide-react';

const features = [
  {
    icon: Lock,
    title: 'Gated Content',
    description: 'Lock premium picks behind paid tiers. Control what\'s free and what\'s exclusive.',
  },
  {
    icon: CreditCard,
    title: 'Simple Payments',
    description: 'Accept monthly subscriptions. Get paid directly — no complicated setup.',
  },
  {
    icon: Globe,
    title: 'Your Profile',
    description: 'A clean public page to showcase your brand and convert followers into paying subscribers.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-28">
      <div className="container max-w-3xl">
        <div className="text-center mb-16">
          <p className="text-[12px] font-medium uppercase tracking-widest text-primary mb-3">Features</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Everything you need to grow
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Built for sports creators who want to build a real business.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group rounded-xl border border-border bg-card/50 p-6 transition-all duration-300 hover:border-primary/20 hover:bg-card"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/8 mb-5 transition-colors group-hover:bg-primary/12">
                <f.icon className="h-[18px] w-[18px] text-primary" />
              </div>
              <h3 className="font-semibold text-[14px] mb-2">{f.title}</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
