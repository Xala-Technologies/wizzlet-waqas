import { DollarSign, Focus, Shield } from 'lucide-react';

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
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[600px] rounded-full opacity-[0.05] blur-[160px] bg-primary" />

      <div className="container relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-primary mb-6 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Invite-only system
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.04em] leading-[1.1] text-foreground mb-5">
            WHY PEOPLE SWITCH
          </h2>

          <p className="text-[15px] sm:text-base text-muted-foreground max-w-[440px] mx-auto leading-relaxed">
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

              <h3 className="text-[17px] font-bold text-foreground mb-2 tracking-tight">
                {card.title}
              </h3>

              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
