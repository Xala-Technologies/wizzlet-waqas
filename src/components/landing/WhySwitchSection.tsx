import { DollarSign, Focus, Shield } from 'lucide-react';
import { LandingSection } from '@/components/landing/LandingSection';

const cards = [
  {
    icon: DollarSign,
    title: 'Monetization first',
    desc: 'Every feature exists to help you earn. No vanity metrics, no filler — just revenue tools that work.',
  },
  {
    icon: Focus,
    title: 'No distractions',
    desc: 'No algorithmic feeds, no endless scrolling. Your audience comes here for one thing — your content.',
  },
  {
    icon: Shield,
    title: 'Built for serious creators',
    desc: 'This isn\'t a hobby platform. If you\'re ready to treat your content like a business, you\'re in the right place.',
  },
];

export function WhySwitchSection() {
  return (
    <LandingSection className="overflow-hidden">
      <div className="container relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-caption uppercase tracking-[0.2em] text-muted-foreground mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Invite-only system
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.04em] leading-[1.1] text-foreground mb-5">
            WHY PEOPLE SWITCH
          </h2>

          <p className="text-ui sm:text-base text-muted-foreground max-w-[440px] mx-auto leading-relaxed">
            Most platforms are built for volume. This one is built for results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {cards.map((card) => (
            <div
              key={card.title}
              className="group relative rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_0_40px_-12px_hsl(var(--primary)/0.2)]"
            >
              <div className="mb-4 inline-flex items-center justify-center h-10 w-10 rounded-xl bg-primary/[0.08] border border-primary/15 text-primary transition-colors duration-300 group-hover:bg-primary/[0.14]">
                <card.icon className="h-5 w-5" />
              </div>

              <h3 className="text-title font-bold text-foreground mb-2 tracking-tight">
                {card.title}
              </h3>

              <p className="text-support text-muted-foreground leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
