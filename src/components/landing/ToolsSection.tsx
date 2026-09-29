import { useId } from 'react';
import { Zap, CreditCard, BarChart3, Lock, Globe, Bell, ArrowRight } from 'lucide-react';
import { LandingSection } from '@/components/landing/LandingSection';
import { cn } from '@/lib/utils';

const FLOW = [
  { id: 'publish', label: 'Publish', detail: 'Posts & picks' },
  { id: 'gate', label: 'Gate', detail: 'Members only' },
  { id: 'charge', label: 'Charge', detail: 'Subscriptions' },
  { id: 'notify', label: 'Notify', detail: 'Keep them close' },
  { id: 'measure', label: 'Measure', detail: 'What works' },
] as const;

const features = [
  {
    icon: Zap,
    title: 'Instant delivery',
    impact: 'Hits land the moment you publish.',
    diagram: 'pulse' as const,
  },
  {
    icon: CreditCard,
    title: 'Built-in payments',
    impact: 'Charge without stitching five tools.',
    diagram: 'pipe' as const,
  },
  {
    icon: Lock,
    title: 'Gated content',
    impact: 'Only paying members see the edge.',
    diagram: 'gate' as const,
  },
  {
    icon: BarChart3,
    title: 'Smart analytics',
    impact: 'See what actually moves revenue.',
    diagram: 'spark' as const,
  },
  {
    icon: Globe,
    title: 'Custom pages',
    impact: 'Your brand, your profile, your rules.',
    diagram: 'orbit' as const,
  },
  {
    icon: Bell,
    title: 'Auto notifications',
    impact: 'Never lose a subscriber’s attention.',
    diagram: 'rings' as const,
  },
];

function MiniDiagram({ kind }: { kind: (typeof features)[number]['diagram'] }) {
  const uid = useId().replace(/:/g, '');

  if (kind === 'spark') {
    return (
      <svg viewBox="0 0 120 48" className="h-12 w-full" aria-hidden>
        <defs>
          <linearGradient id={`spark-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#429FF0" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#429FF0" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 36 L18 28 L36 32 L54 18 L72 22 L90 10 L120 14 L120 48 L0 48 Z"
          fill={`url(#spark-${uid})`}
        />
        <path
          d="M0 36 L18 28 L36 32 L54 18 L72 22 L90 10 L120 14"
          fill="none"
          stroke="#429FF0"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === 'pipe') {
    return (
      <svg viewBox="0 0 120 48" className="h-12 w-full" aria-hidden>
        <rect x="4" y="18" width="28" height="12" rx="6" fill="#E1F2FF" stroke="#429FF0" strokeWidth="1.5" />
        <path d="M36 24 H52" stroke="#429FF0" strokeWidth="2" strokeDasharray="3 3" />
        <circle cx="60" cy="24" r="8" fill="#429FF0" />
        <text x="60" y="27" textAnchor="middle" fill="white" fontSize="8" fontWeight="700">
          $
        </text>
        <path d="M68 24 H84" stroke="#429FF0" strokeWidth="2" strokeDasharray="3 3" />
        <rect x="88" y="14" width="28" height="20" rx="6" fill="#08182F" />
        <path d="M96 24h12M102 18v12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'gate') {
    return (
      <svg viewBox="0 0 120 48" className="h-12 w-full" aria-hidden>
        <rect x="8" y="10" width="40" height="28" rx="8" fill="#E1F2FF" />
        <circle cx="28" cy="24" r="6" fill="#429FF0" opacity="0.35" />
        <path d="M52 24 H68" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 3" />
        <rect x="72" y="8" width="40" height="32" rx="8" fill="#08182F" />
        <rect x="84" y="18" width="16" height="12" rx="3" fill="#429FF0" />
        <circle cx="92" cy="24" r="2" fill="white" />
      </svg>
    );
  }

  if (kind === 'pulse') {
    return (
      <svg viewBox="0 0 120 48" className="h-12 w-full" aria-hidden>
        <circle cx="24" cy="24" r="10" fill="#E1F2FF" />
        <circle cx="24" cy="24" r="4" fill="#429FF0" />
        <path
          d="M38 24 H52"
          stroke="#429FF0"
          strokeWidth="2"
          strokeLinecap="round"
          className="origin-left"
        />
        <path
          d="M52 24 L70 12 L82 34 L94 18 L112 24"
          fill="none"
          stroke="#429FF0"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === 'orbit') {
    return (
      <svg viewBox="0 0 120 48" className="h-12 w-full" aria-hidden>
        <ellipse cx="60" cy="24" rx="46" ry="14" fill="none" stroke="#BFE8FF" strokeWidth="1.5" />
        <circle cx="60" cy="24" r="8" fill="#429FF0" />
        <circle cx="18" cy="20" r="4" fill="#E1F2FF" stroke="#429FF0" strokeWidth="1.5" />
        <circle cx="102" cy="28" r="4" fill="#E1F2FF" stroke="#429FF0" strokeWidth="1.5" />
        <circle cx="72" cy="12" r="3" fill="#62E2EC" />
      </svg>
    );
  }

  // rings
  return (
    <svg viewBox="0 0 120 48" className="h-12 w-full" aria-hidden>
      <circle cx="36" cy="24" r="6" fill="#429FF0" />
      <circle cx="36" cy="24" r="12" fill="none" stroke="#429FF0" strokeOpacity="0.45" strokeWidth="1.5" />
      <circle cx="36" cy="24" r="18" fill="none" stroke="#429FF0" strokeOpacity="0.25" strokeWidth="1.5" />
      <circle cx="36" cy="24" r="24" fill="none" stroke="#429FF0" strokeOpacity="0.12" strokeWidth="1.5" />
      <rect x="72" y="14" width="36" height="8" rx="4" fill="#E1F2FF" />
      <rect x="72" y="26" width="28" height="8" rx="4" fill="#BFE8FF" />
    </svg>
  );
}

function SystemLoopDiagram() {
  const uid = useId().replace(/:/g, '');

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white p-6 shadow-[0_20px_50px_rgba(8,24,47,0.08)] sm:p-8">
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#E1F2FF]/90 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-[#62E2EC]/20 blur-3xl"
        aria-hidden
      />

      <div className="relative mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#429FF0]">
            System loop
          </p>
          <h3 className="mt-2 text-xl font-extrabold tracking-tight text-[#08182F] sm:text-2xl">
            How Sweeph compounds
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            One continuous loop — publish, gate, charge, notify, measure — without tool-hopping.
          </p>
        </div>
        <span className="hidden shrink-0 rounded-full bg-[#E1F2FF] px-3 py-1 text-xs font-bold text-[#256DC1] sm:inline-flex">
          Live product
        </span>
      </div>

      {/* Horizontal flow — desktop */}
      <div className="relative hidden md:block">
        <svg viewBox="0 0 640 120" className="mb-2 h-auto w-full" aria-hidden>
          <defs>
            <linearGradient id={`flow-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#429FF0" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#429FF0" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#62E2EC" stopOpacity="0.7" />
            </linearGradient>
            <marker
              id={`arrow-${uid}`}
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill="#429FF0" />
            </marker>
          </defs>
          <path
            d="M40 60 H600"
            fill="none"
            stroke={`url(#flow-${uid})`}
            strokeWidth="3"
            strokeLinecap="round"
            markerEnd={`url(#arrow-${uid})`}
          />
          {[0, 1, 2, 3, 4].map((i) => {
            const x = 40 + i * 140;
            return (
              <g key={i}>
                <circle cx={x} cy="60" r="18" fill="white" stroke="#429FF0" strokeWidth="2.5" />
                <circle cx={x} cy="60" r="7" fill="#429FF0" />
              </g>
            );
          })}
        </svg>
        <div className="grid grid-cols-5 gap-2">
          {FLOW.map((step, i) => (
            <div key={step.id} className="text-center">
              <p className="text-sm font-bold text-foreground">{step.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
              {i < FLOW.length - 1 ? (
                <span className="sr-only">then</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Stacked flow — mobile */}
      <ol className="relative space-y-3 md:hidden">
        {FLOW.map((step, i) => (
          <li key={step.id} className="relative flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#429FF0] bg-white text-sm font-bold text-[#429FF0]">
              {i + 1}
            </span>
            <div className="flex-1 rounded-2xl border border-border bg-[#F7FAFD] px-4 py-3 dark:bg-muted/30">
              <p className="text-sm font-bold text-foreground">{step.label}</p>
              <p className="text-xs text-muted-foreground">{step.detail}</p>
            </div>
            {i < FLOW.length - 1 ? (
              <ArrowRight className="absolute -bottom-3 left-[1.15rem] h-3 w-3 rotate-90 text-[#429FF0]/50" />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ToolsSection() {
  return (
    <LandingSection className="relative overflow-hidden bg-[#F4FAFF] dark:bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(66,159,240,0.14),transparent_50%),radial-gradient(ellipse_at_90%_80%,rgba(98,226,236,0.1),transparent_45%)]"
        aria-hidden
      />

      <div className="container relative z-10">
        <div className="mb-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-end lg:gap-12">
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.32em] text-[#429FF0]">
              Capabilities
            </p>
            <h2 className="max-w-xl text-[2rem] font-extrabold leading-[1.08] tracking-[-0.045em] text-foreground sm:text-4xl lg:text-[2.75rem]">
              Tools that actually{' '}
              <span className="text-[#429FF0]">move numbers.</span>
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground lg:justify-self-end lg:text-right">
            Publish, gate, charge, and grow in one stack — each capability shown as how it actually
            flows through Sweeph.
          </p>
        </div>

        <div className="mx-auto mb-8 max-w-6xl">
          <SystemLoopDiagram />
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className={cn(
                'group flex flex-col rounded-3xl border border-white/80 bg-white/95 p-5 shadow-[0_10px_32px_rgba(8,24,47,0.06)]',
                'transition-[transform,box-shadow,border-color] duration-200',
                'hover:-translate-y-0.5 hover:border-[#429FF0]/30 hover:shadow-[0_16px_40px_rgba(8,24,47,0.1)]',
              )}
            >
              <div className="mb-4 rounded-2xl bg-[#F4FAFF] px-3 py-3 dark:bg-muted/20">
                <MiniDiagram kind={f.diagram} />
              </div>
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E1F2FF] text-[#429FF0]">
                  <f.icon className="h-4 w-4" aria-hidden />
                </span>
                <h3 className="text-base font-bold tracking-tight text-foreground">{f.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.impact}</p>
            </article>
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
