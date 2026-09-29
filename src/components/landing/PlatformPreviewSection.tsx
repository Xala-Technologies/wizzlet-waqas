import { TrendingUp, Users, ArrowUpRight, ArrowDownRight, MessageSquare, CreditCard, UserPlus } from 'lucide-react';
import { LandingSection } from '@/components/landing/LandingSection';
import {
  LandingSectionHeader,
  landingCardClass,
} from '@/components/landing/LandingSectionHeader';
import { cn } from '@/lib/utils';

const revenueData = [18, 25, 22, 35, 30, 42, 38, 52, 48, 60, 55, 68];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const activity = [
  { icon: UserPlus, text: 'New subscriber joined', time: '2m ago', color: 'text-emerald-600' },
  { icon: CreditCard, text: 'Payment received', time: '18m ago', color: 'text-[#429FF0]' },
  { icon: MessageSquare, text: 'New message from subscriber', time: '1h ago', color: 'text-sky-600' },
  { icon: UserPlus, text: 'New subscriber joined', time: '3h ago', color: 'text-emerald-600' },
  { icon: CreditCard, text: 'Payment received', time: '5h ago', color: 'text-[#429FF0]' },
];

function MiniGraph() {
  const max = Math.max(...revenueData);
  const h = 120;
  const w = 100;
  const points = revenueData
    .map((v, i) => `${(i / (revenueData.length - 1)) * w},${h - (v / max) * h}`)
    .join(' ');
  const areaPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h + 10}`} className="h-full w-full" preserveAspectRatio="none">
      <polygon points={areaPoints} fill="rgba(66,159,240,0.12)" />
      <polyline
        points={points}
        fill="none"
        stroke="#429FF0"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlatformPreviewSection() {
  return (
    <LandingSection className="overflow-hidden bg-white dark:bg-background">
      <div className="container relative z-10">
        <LandingSectionHeader
          align="center"
          eyebrow="Platform"
          title={
            <>
              See what you’re <span className="text-[#429FF0]">working with.</span>
            </>
          }
          description="A clear view of revenue, members, and activity — without the clutter."
        />

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 lg:grid-cols-12">
          <div className={cn(landingCardClass, 'p-6 lg:col-span-7')}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Revenue
                </p>
                <p className="text-2xl font-extrabold tracking-tight text-foreground">$—,———</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>+—%</span>
              </div>
            </div>
            <div className="h-[140px] w-full">
              <MiniGraph />
            </div>
            <div className="mt-3 flex justify-between px-1">
              {months.map((m) => (
                <span key={m} className="text-[10px] text-muted-foreground/50">
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5 lg:col-span-5">
            <div className={cn(landingCardClass, 'p-6')}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E1F2FF] text-[#429FF0]">
                    <Users className="h-4 w-4" aria-hidden />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Subscribers
                    </p>
                    <p className="text-xl font-extrabold tracking-tight text-foreground">———</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <TrendingUp className="h-3 w-3" />
                  <span>+—%</span>
                </div>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Active</p>
                  <p className="text-sm font-bold text-foreground">——</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">New this week</p>
                  <p className="text-sm font-bold text-foreground">——</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Churn</p>
                  <p className="flex items-center gap-1 text-sm font-bold text-foreground">
                    <ArrowDownRight className="h-3 w-3 text-emerald-600" />
                    ——%
                  </p>
                </div>
              </div>
            </div>

            <div className={cn(landingCardClass, 'flex-1 p-5')}>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Activity
              </p>
              <div className="space-y-3">
                {activity.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E1F2FF]">
                      <item.icon className={cn('h-3.5 w-3.5', item.color)} />
                    </div>
                    <p className="flex-1 truncate text-sm text-foreground/80">{item.text}</p>
                    <span className="shrink-0 text-xs text-muted-foreground/50">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
