import { Zap, CreditCard, BarChart3, Lock, Globe, Bell } from 'lucide-react';

const features = [
  { icon: Zap, title: 'Instant delivery', impact: 'Reach your audience without delay' },
  { icon: CreditCard, title: 'Built-in payments', impact: 'Get paid without friction' },
  { icon: BarChart3, title: 'Smart analytics', impact: 'See what actually works' },
  { icon: Lock, title: 'Gated content', impact: 'Control who sees what you build' },
  { icon: Globe, title: 'Custom pages', impact: 'Your brand, your rules' },
  { icon: Bell, title: 'Auto notifications', impact: 'Never lose a subscriber\'s attention' },
];

export function ToolsSection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-[400px] w-[800px] rounded-full opacity-[0.04] blur-[160px] bg-primary" />

      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-[3.25rem] font-extrabold tracking-[-0.04em] leading-[1.05] text-foreground">
            TOOLS THAT ACTUALLY
            <br />
            <span className="text-gradient">MOVE NUMBERS</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_0_36px_-10px_hsl(var(--primary)/0.18)]"
            >
              <div className="mb-5 inline-flex items-center justify-center h-9 w-9 rounded-lg bg-primary/[0.07] border border-primary/10 text-primary/70 transition-all duration-300 group-hover:text-primary group-hover:bg-primary/[0.12]">
                <f.icon className="h-[18px] w-[18px]" />
              </div>

              <h3 className="text-[15px] font-bold text-foreground mb-1.5 tracking-tight">
                {f.title}
              </h3>

              <p className="text-[13px] text-muted-foreground leading-snug">
                {f.impact}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
