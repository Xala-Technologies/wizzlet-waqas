import { TrendingUp, Users, ArrowUpRight, ArrowDownRight, MessageSquare, CreditCard, UserPlus } from 'lucide-react';

const revenueData = [18, 25, 22, 35, 30, 42, 38, 52, 48, 60, 55, 68];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const activity = [
  { icon: UserPlus, text: 'New subscriber joined', time: '2m ago', color: 'text-emerald-500 dark:text-emerald-400' },
  { icon: CreditCard, text: 'Payment received', time: '18m ago', color: 'text-primary' },
  { icon: MessageSquare, text: 'New message from subscriber', time: '1h ago', color: 'text-blue-500 dark:text-blue-400' },
  { icon: UserPlus, text: 'New subscriber joined', time: '3h ago', color: 'text-emerald-500 dark:text-emerald-400' },
  { icon: CreditCard, text: 'Payment received', time: '5h ago', color: 'text-primary' },
];

function MiniGraph() {
  const max = Math.max(...revenueData);
  const h = 120;
  const w = 100;
  const points = revenueData.map((v, i) => `${(i / (revenueData.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  const areaPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h + 10}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="graphGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="[stop-color:hsl(var(--primary))]" stopOpacity="0.3" />
          <stop offset="100%" className="[stop-color:hsl(var(--primary))]" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" className="[stop-color:hsl(var(--primary))]" />
          <stop offset="100%" className="[stop-color:hsl(var(--accent))]" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#graphGrad)" />
      <polyline points={points} fill="none" stroke="url(#lineGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlatformPreviewSection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full opacity-[0.04] blur-[180px] bg-primary" />

      <div className="container relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl md:text-[3.25rem] font-extrabold tracking-[-0.04em] leading-[1.05] text-foreground">
            SEE WHAT YOU'RE
            <br />
            <span className="text-gradient">WORKING WITH</span>
          </h2>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Revenue Graph */}
          <div className="lg:col-span-7 rounded-2xl border border-border bg-card/70 backdrop-blur-md p-6 card-shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Revenue</p>
                <p className="text-2xl font-bold text-foreground tracking-tight">$—,———</p>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400 text-[13px] font-medium">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>+—%</span>
              </div>
            </div>
            <div className="h-[140px] w-full">
              <MiniGraph />
            </div>
            <div className="flex justify-between mt-3 px-1">
              {months.map((m) => (
                <span key={m} className="text-[9px] text-muted-foreground/50">{m}</span>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Subscribers */}
            <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-md p-6 card-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/[0.08] border border-primary/15 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Subscribers</p>
                    <p className="text-xl font-bold text-foreground tracking-tight">———</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400 text-[12px] font-medium">
                  <TrendingUp className="h-3 w-3" />
                  <span>+—%</span>
                </div>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Active</p>
                  <p className="text-sm font-semibold text-foreground">——</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">New this week</p>
                  <p className="text-sm font-semibold text-foreground">——</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Churn</p>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                    <ArrowDownRight className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />——%
                  </p>
                </div>
              </div>
            </div>

            {/* Activity feed */}
            <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-md p-5 card-shadow flex-1">
              <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-4">Activity</p>
              <div className="space-y-3">
                {activity.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                      <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                    </div>
                    <p className="text-[13px] text-foreground/80 flex-1 truncate">{item.text}</p>
                    <span className="text-[11px] text-muted-foreground/50 flex-shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
