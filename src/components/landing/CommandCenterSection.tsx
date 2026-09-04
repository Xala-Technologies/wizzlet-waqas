import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Bell, Settings, Zap, TrendingUp, Shield } from 'lucide-react';

function FloatingCard({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <div className={`absolute rounded-xl border border-border/60 bg-card/80 backdrop-blur-md card-shadow ${className}`}>
      {children}
    </div>
  );
}

export function CommandCenterSection() {
  return (
    <section className="relative py-28 md:py-36 overflow-hidden">
      {/* Grid background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `
          linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        animation: 'grid-drift 20s linear infinite',
      }} />

      {/* Radial fade */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: 'radial-gradient(ellipse 50% 50% at 50% 50%, transparent 30%, hsl(var(--background)) 70%)',
      }} />

      {/* Glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full opacity-[0.06] blur-[140px] bg-primary" />

      <div className="container relative z-10">
        {/* Floating elements */}
        <div className="hidden lg:block">
          <FloatingCard className="top-4 left-[8%] p-3 animate-[float-1_6s_ease-in-out_infinite]">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Revenue</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-foreground">$——,———</span>
              <span className="text-[10px] text-emerald-500 dark:text-emerald-400 flex items-center"><TrendingUp className="h-2.5 w-2.5 mr-0.5" />+—%</span>
            </div>
          </FloatingCard>

          <FloatingCard className="top-8 right-[10%] p-3 animate-[float-2_7s_ease-in-out_infinite]">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-foreground font-medium">New subscriber</p>
                <p className="text-[10px] text-muted-foreground">Just now</p>
              </div>
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse ml-1" />
            </div>
          </FloatingCard>

          <FloatingCard className="bottom-12 left-[12%] p-3 animate-[float-3_8s_ease-in-out_infinite]">
            <div className="flex items-center gap-2">
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">Payouts</span>
              <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-medium ml-2">Active</span>
            </div>
          </FloatingCard>

          <FloatingCard className="bottom-16 right-[8%] p-3 animate-[float-1_9s_ease-in-out_infinite_1s]">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-primary/70" />
              <span className="text-[11px] text-muted-foreground">Gated content</span>
              <Zap className="h-3 w-3 text-primary ml-1" />
            </div>
          </FloatingCard>

          <FloatingCard className="top-1/2 -translate-y-1/2 left-[4%] p-3 animate-[float-2_7.5s_ease-in-out_infinite_0.5s]">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">——</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Active subs</p>
            </div>
          </FloatingCard>
        </div>

        {/* Center content */}
        <div className="relative mx-auto max-w-[580px] text-center">
          <h2 className="text-3xl sm:text-4xl md:text-[3.5rem] font-extrabold tracking-[-0.04em] leading-[1.05] text-foreground mb-5">
            RUN EVERYTHING
            <br />
            FROM{' '}
            <span className="text-gradient">ONE PLACE</span>
          </h2>

          <p className="text-[15px] sm:text-base text-muted-foreground max-w-[400px] mx-auto mb-10 leading-relaxed">
            No switching tools. No chaos. Just control.
          </p>

          <Link to="/signup">
            <Button variant="hero" size="lg" className="h-13 px-10 text-[15px]">
              Request Access <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
