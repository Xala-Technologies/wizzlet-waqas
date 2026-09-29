import { useEffect, useState } from 'react';
import { BadgeCheck, Quote } from 'lucide-react';
import { LandingSection } from '@/components/landing/LandingSection';
import { LandingSectionHeader } from '@/components/landing/LandingSectionHeader';
import { cn } from '@/lib/utils';

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  sport: string;
  avatar: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'I stopped juggling Stripe links, Discord gates, and spreadsheets. Sweeph put subscriptions and picks in one place — members finally know where to pay.',
    name: 'Jordan Miles',
    role: 'NFL analyst',
    sport: 'Football',
    avatar: 'https://api.dicebear.com/9.x/adventurer/png?seed=Jordan&size=96&backgroundColor=b6e3f4',
  },
  {
    quote: 'Went live in under an hour. Clean setup, no fluff — exactly what serious creators need.',
    name: 'Kai Rivera',
    role: 'NBA props',
    sport: 'Basketball',
    avatar: 'https://api.dicebear.com/9.x/adventurer/png?seed=Kai&size=96&backgroundColor=c0aede',
  },
  {
    quote: 'My audience stopped asking “where do I subscribe?” The profile + products flow just works.',
    name: 'Noor Shah',
    role: 'Tennis models',
    sport: 'Tennis',
    avatar: 'https://api.dicebear.com/9.x/adventurer/png?seed=Noor&size=96&backgroundColor=ffd5dc',
  },
  {
    quote: 'Payouts and gated posts without five tools. Feels built for people who treat content like a business.',
    name: 'Leo Anders',
    role: 'NHL lines',
    sport: 'Hockey',
    avatar: 'https://api.dicebear.com/9.x/adventurer/png?seed=Leo&size=96&backgroundColor=d1d4f9',
  },
];

const ROTATE_MS = 5200;

const STATS = [
  { value: '50k+', label: 'Creators building' },
  { value: 'Invite-only', label: 'Manually reviewed' },
  { value: 'One place', label: 'Subs, posts, payouts' },
];

function PersonRow({ t, size = 'md' }: { t: Testimonial; size?: 'md' | 'sm' }) {
  const avatarSize = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';
  return (
    <div className="flex items-center gap-3">
      <img
        src={t.avatar}
        alt=""
        className={cn('rounded-full border-2 border-card object-cover shadow-sm', avatarSize)}
      />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-bold text-foreground">{t.name}</p>
          <BadgeCheck className="h-4 w-4 shrink-0 text-[#429FF0]" aria-label="Verified" />
        </div>
        <p className="truncate text-xs font-medium text-muted-foreground">
          {t.role} · {t.sport}
        </p>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const featured = TESTIMONIALS[active]!;
  const side = TESTIMONIALS.map((t, i) => ({ t, i })).filter(({ i }) => i !== active);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % TESTIMONIALS.length);
      setAnimKey((k) => k + 1);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const promote = (index: number) => {
    if (index === active) return;
    setActive(index);
    setAnimKey((k) => k + 1);
  };

  return (
    <LandingSection className="relative overflow-hidden bg-[#F4FAFF] dark:bg-secondary/50">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(66,159,240,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(98,226,236,0.08),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(101,184,247,0.1),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(98,226,236,0.05),transparent_50%)]"
        aria-hidden
      />

      <div className="container relative z-10">
        <LandingSectionHeader
          align="center"
          eyebrow="From the roster"
          title={
            <>
              Creators who built it <span className="text-[#429FF0]">properly.</span>
            </>
          }
          description="Real switchers — subscriptions, gated picks, and payouts without the tool pile-up."
        />

        <div
          className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-12 lg:gap-6"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
          }}
        >
          {/* Featured — cycles through each testimonial */}
          <article
            key={`featured-${animKey}`}
            className={cn(
              'relative flex flex-col justify-between overflow-hidden rounded-[1.75rem] border border-border bg-card p-8 shadow-[0_20px_50px_rgba(8,24,47,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] sm:p-10',
              'animate-fade-in-up lg:col-span-7 lg:min-h-[340px]',
            )}
            aria-live="polite"
            aria-atomic="true"
          >
            <div
              className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[#E1F2FF]/80 blur-2xl dark:bg-primary/15"
              aria-hidden
            />
            <Quote className="mb-6 h-10 w-10 text-[#429FF0]/35 dark:text-primary/40" strokeWidth={1.5} aria-hidden />
            <blockquote className="relative max-w-xl text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl sm:leading-[1.35]">
              “{featured.quote}”
            </blockquote>
            <div className="relative mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-6">
              <PersonRow t={featured} />
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#E1F2FF] px-3 py-1 text-xs font-bold text-[#256DC1] dark:bg-primary/15 dark:text-primary">
                  Featured
                </span>
                {/* Progress dots */}
                <div className="flex items-center gap-1.5" role="tablist" aria-label="Testimonials">
                  {TESTIMONIALS.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={i === active}
                      aria-label={`Show testimonial ${i + 1}`}
                      onClick={() => promote(i)}
                      className={cn(
                        'h-2 rounded-full transition-all duration-300',
                        i === active ? 'w-6 bg-[#429FF0]' : 'w-2 bg-[#429FF0]/30 hover:bg-[#429FF0]/55',
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </article>

          {/* Side cards — click to promote into featured */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            {side.map(({ t, i }) => (
              <button
                key={t.name}
                type="button"
                onClick={() => promote(i)}
                className={cn(
                  'group flex flex-1 flex-col justify-between rounded-3xl border border-border bg-card/95 p-5 text-left shadow-[0_10px_32px_rgba(8,24,47,0.06)] backdrop-blur-sm dark:shadow-[0_10px_32px_rgba(0,0,0,0.35)]',
                  'transition-[transform,box-shadow,border-color] duration-200',
                  'hover:-translate-y-0.5 hover:border-[#429FF0]/30 hover:shadow-[0_16px_40px_rgba(8,24,47,0.1)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#429FF0]/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background',
                )}
              >
                <blockquote className="text-[15px] font-medium leading-relaxed text-foreground/90 line-clamp-3">
                  “{t.quote}”
                </blockquote>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <PersonRow t={t} size="sm" />
                  <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-[#429FF0] opacity-0 transition-opacity group-hover:opacity-100">
                    View
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card/80 px-5 py-4 shadow-[0_6px_20px_rgba(8,24,47,0.04)] backdrop-blur-sm dark:shadow-[0_6px_20px_rgba(0,0,0,0.3)]"
            >
              <span className="text-lg font-extrabold tracking-tight text-[#429FF0] sm:text-xl">
                {s.value}
              </span>
              <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
