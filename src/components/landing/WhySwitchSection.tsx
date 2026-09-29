import { Check, X } from 'lucide-react';
import { LandingSection } from '@/components/landing/LandingSection';
import { cn } from '@/lib/utils';

const BEFORE = [
  'Vanity dashboards that don’t pay you',
  'Five tools glued together with Discord',
  'Feeds built for scrolling, not selling',
];

const AFTER = [
  {
    n: '01',
    title: 'Monetization first',
    desc: 'Every feature exists to help you earn — subscriptions, gated picks, payouts.',
    visual: 'revenue' as const,
  },
  {
    n: '02',
    title: 'No distractions',
    desc: 'No algorithmic feeds. Members show up for your content — nothing else.',
    visual: 'focus' as const,
  },
  {
    n: '03',
    title: 'Built for serious creators',
    desc: 'Invite-only infrastructure for people who treat their edge like a business.',
    visual: 'shield' as const,
  },
];

function ReasonVisual({ kind }: { kind: 'revenue' | 'focus' | 'shield' }) {
  if (kind === 'revenue') {
    return (
      <svg viewBox="0 0 88 64" className="h-14 w-20" aria-hidden>
        <rect x="6" y="28" width="12" height="28" rx="3" fill="#E1F2FF" />
        <rect x="24" y="18" width="12" height="38" rx="3" fill="#BFE8FF" />
        <rect x="42" y="10" width="12" height="46" rx="3" fill="#74CCFF" />
        <rect x="60" y="4" width="12" height="52" rx="3" fill="#429FF0" />
        <path
          d="M8 22 L28 16 L46 12 L70 6"
          fill="none"
          stroke="#08182F"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="70" cy="6" r="3.5" fill="#08182F" />
      </svg>
    );
  }
  if (kind === 'focus') {
    return (
      <svg viewBox="0 0 88 64" className="h-14 w-20" aria-hidden>
        <circle cx="44" cy="32" r="22" fill="none" stroke="#E1F2FF" strokeWidth="6" />
        <circle cx="44" cy="32" r="14" fill="none" stroke="#BFE8FF" strokeWidth="5" />
        <circle cx="44" cy="32" r="6" fill="#429FF0" />
        <path
          d="M44 10 V4 M44 60 V54 M10 32 H4 M84 32 H78"
          stroke="#429FF0"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 88 64" className="h-14 w-20" aria-hidden>
      <path
        d="M44 8 L72 20 V36 C72 48 60 56 44 60 C28 56 16 48 16 36 V20 Z"
        fill="#E1F2FF"
        stroke="#429FF0"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M34 34 L42 42 L56 26"
        fill="none"
        stroke="#429FF0"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WhySwitchSection() {
  return (
    <LandingSection className="relative overflow-hidden bg-white dark:bg-background">
      {/* Soft diagonal wash — different energy from Tools / Testimonials */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#ffffff_0%,#F4FAFF_45%,#E1F2FF_100%)] opacity-80 dark:opacity-20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-[#429FF0]/[0.07] blur-3xl"
        aria-hidden
      />

      <div className="container relative z-10">
        <div className="mb-12 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#429FF0]/25 bg-white px-3.5 py-1.5 shadow-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#429FF0]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#429FF0]">
              Invite-only
            </span>
          </div>
          <h2 className="text-[2rem] font-extrabold leading-[1.08] tracking-[-0.045em] text-foreground sm:text-4xl lg:text-[2.75rem]">
            Why people <span className="text-[#429FF0]">switch.</span>
          </h2>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Most platforms are built for volume. This one is built for results.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-8">
          {/* Before — light, readable “leave behind” panel */}
          <aside className="relative flex flex-col overflow-hidden rounded-[1.75rem] border border-border bg-white p-7 shadow-[0_12px_36px_rgba(8,24,47,0.06)] sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <X className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                  What they leave
                </p>
                <h3 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                  The old stack
                </h3>
              </div>
            </div>

            <ul className="flex flex-1 flex-col gap-3">
              {BEFORE.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-border/80 bg-[#F7FAFD] px-4 py-3.5 dark:bg-muted/30"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                  </span>
                  <span className="text-sm font-semibold leading-relaxed text-foreground">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-2">
              {['Volume', 'Noise', 'Friction'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </aside>

          {/* After — numbered reasons with diagrams */}
          <div className="flex flex-col gap-4">
            <div className="mb-1 flex items-center justify-between gap-3 px-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#429FF0]">
                What they choose
              </p>
              <span className="hidden items-center gap-1.5 text-xs font-semibold text-muted-foreground sm:inline-flex">
                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                Results · Clarity · Control
              </span>
            </div>

            {AFTER.map((reason, i) => (
              <article
                key={reason.n}
                className={cn(
                  'group flex flex-col gap-4 rounded-[1.5rem] border border-border/80 bg-white p-5 shadow-[0_10px_32px_rgba(8,24,47,0.05)] sm:flex-row sm:items-center sm:gap-6 sm:p-6',
                  'transition-[transform,box-shadow,border-color] duration-200',
                  'hover:-translate-y-0.5 hover:border-[#429FF0]/30 hover:shadow-[0_16px_40px_rgba(8,24,47,0.1)]',
                )}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-4 sm:w-[7.5rem] sm:shrink-0 sm:flex-col sm:items-start sm:gap-2">
                  <span className="text-3xl font-extrabold tracking-tighter text-[#429FF0]/35 transition-colors group-hover:text-[#429FF0]">
                    {reason.n}
                  </span>
                  <div className="rounded-2xl bg-[#F4FAFD] px-2 py-1.5 dark:bg-muted/30">
                    <ReasonVisual kind={reason.visual} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-extrabold tracking-tight text-foreground">
                    {reason.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {reason.desc}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
