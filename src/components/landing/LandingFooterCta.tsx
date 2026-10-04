import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SweephRibbonBackground } from '@/components/brand/SweephRibbonBackground';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const EMOJI_TILES = [
  { emoji: '⚽', className: 'left-[6%] top-[10%] h-[76px] w-[76px] rotate-[-8deg] text-[2rem]' },
  { emoji: '🏀', className: 'left-[32%] top-[4%] h-[88px] w-[88px] rotate-[6deg] text-[2.25rem]' },
  { emoji: '🎾', className: 'right-[8%] top-[8%] h-[72px] w-[72px] rotate-[9deg] text-[1.85rem]' },
  { emoji: '🏒', className: 'left-[4%] top-[46%] h-[70px] w-[70px] rotate-[5deg] text-[1.75rem]' },
  { emoji: '✍️', className: 'left-[36%] top-[40%] h-[92px] w-[92px] rotate-[-4deg] text-[2.1rem]' },
  { emoji: '⚾', className: 'right-[6%] top-[38%] h-[74px] w-[74px] rotate-[-7deg] text-[1.9rem]' },
  { emoji: '🥊', className: 'left-[18%] bottom-[6%] h-[78px] w-[78px] rotate-[-6deg] text-[1.9rem]' },
  { emoji: '🏆', className: 'left-[46%] bottom-[8%] h-[72px] w-[72px] rotate-[8deg] text-[1.8rem]' },
  { emoji: '🎮', className: 'right-[10%] bottom-[4%] h-[80px] w-[80px] rotate-[4deg] text-[2rem]' },
] as const;

function CtaCollage() {
  return (
    <div className="relative mx-auto h-[240px] w-full max-w-[400px] lg:h-[260px]" aria-hidden>
      {EMOJI_TILES.map(({ emoji, className }) => (
        <div
          key={className}
          className={cn(
            'absolute flex items-center justify-center rounded-2xl border border-white/80 bg-white shadow-[0_12px_28px_rgba(8,24,47,0.1)] dark:border-white/10 dark:bg-card',
            className,
          )}
        >
          <span className="leading-none">{emoji}</span>
        </div>
      ))}
    </div>
  );
}

/** Home / marketing “Ready to start creating?” band from the PO footer mock. */
export function LandingFooterCta() {
  const { user, role } = useAuth();
  const href = user
    ? role === 'creator'
      ? '/creator'
      : role === 'admin'
        ? '/admin'
        : '/select-role'
    : '/signup';
  const label = user && role === 'creator' ? 'Open creator dashboard' : 'Become a Creator';

  return (
    <section className="relative overflow-hidden">
      <SweephRibbonBackground variant="home" />
      <div className="container relative z-10 py-12 md:py-16">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="max-w-xl">
            <h2 className="text-[2rem] font-extrabold leading-[1.1] tracking-[-0.04em] text-foreground sm:text-[2.5rem]">
              Ready to start <span className="text-[#429FF0]">creating?</span>
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Build your community and earn with Sweeph.
            </p>
            <Link to={href} className="mt-7 inline-block">
              <Button
                variant="hero"
                size="lg"
                className="h-12 rounded-full px-7 text-base font-semibold"
              >
                {label} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <CtaCollage />
        </div>
      </div>
    </section>
  );
}
