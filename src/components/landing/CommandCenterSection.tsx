import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Bell, Settings, Zap, TrendingUp, Shield } from 'lucide-react';
import { LandingSection } from '@/components/landing/LandingSection';
import { LandingSectionHeader } from '@/components/landing/LandingSectionHeader';

function FloatingCard({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <div
      className={`absolute rounded-2xl border border-border bg-card p-3 shadow-[0_12px_36px_rgba(8,24,47,0.1)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.4)] ${className}`}
    >
      {children}
    </div>
  );
}

export function CommandCenterSection() {
  return (
    <LandingSection
      variant="band"
      className="overflow-hidden bg-[#F4FAFF] dark:bg-secondary/50"
    >
      <div className="container relative z-10">
        <div className="hidden lg:block">
          <FloatingCard className="left-[8%] top-4 animate-[float-1_6s_ease-in-out_infinite]">
            <div className="mb-2 flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-[#429FF0]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Revenue
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-foreground">$——,———</span>
              <span className="flex items-center text-[11px] font-semibold text-emerald-600">
                <TrendingUp className="mr-0.5 h-2.5 w-2.5" />
                +—%
              </span>
            </div>
          </FloatingCard>

          <FloatingCard className="right-[10%] top-8 animate-[float-2_7s_ease-in-out_infinite]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E1F2FF]">
                <Bell className="h-3.5 w-3.5 text-[#429FF0]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">New subscriber</p>
                <p className="text-[11px] text-muted-foreground">Just now</p>
              </div>
              <span className="ml-1 h-2 w-2 animate-pulse rounded-full bg-[#429FF0]" />
            </div>
          </FloatingCard>

          <FloatingCard className="bottom-12 left-[12%] animate-[float-3_8s_ease-in-out_infinite]">
            <div className="flex items-center gap-2">
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Payouts</span>
              <span className="ml-2 text-xs font-semibold text-emerald-600">Active</span>
            </div>
          </FloatingCard>

          <FloatingCard className="bottom-16 right-[8%] animate-[float-1_9s_ease-in-out_infinite_1s]">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-[#429FF0]" />
              <span className="text-xs text-muted-foreground">Gated content</span>
              <Zap className="ml-1 h-3 w-3 text-[#429FF0]" />
            </div>
          </FloatingCard>

          <FloatingCard className="left-[4%] top-1/2 -translate-y-1/2 animate-[float-2_7.5s_ease-in-out_infinite_0.5s]">
            <div className="text-center">
              <p className="text-lg font-extrabold text-foreground">——</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Active subs
              </p>
            </div>
          </FloatingCard>
        </div>

        <div className="relative mx-auto max-w-[580px]">
          <LandingSectionHeader
            align="center"
            eyebrow="Command center"
            title={
              <>
                Run everything from <span className="text-[#429FF0]">one place.</span>
              </>
            }
            description="No switching tools. No chaos. Just control."
            className="mb-8"
          />

          <div className="text-center">
            <Link to="/signup">
              <Button
                variant="hero"
                size="lg"
                className="h-14 rounded-full px-10 text-base font-semibold"
              >
                Request Access <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
