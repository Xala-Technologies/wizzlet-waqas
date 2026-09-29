import { cn } from '@/lib/utils';

const SPORT_CARDS = [
  {
    label: 'Football',
    emoji: '⚽',
    className: 'left-[18%] top-[12%] rotate-[-8deg]',
  },
  {
    label: 'Basketball',
    emoji: '🏀',
    className: 'right-[14%] top-[10%] rotate-[7deg]',
  },
  {
    label: 'Tennis',
    emoji: '🎾',
    className: 'left-[12%] top-[40%] rotate-[5deg]',
  },
  {
    label: 'Hockey',
    emoji: '🏒',
    className: 'right-[16%] top-[38%] rotate-[-6deg]',
  },
  {
    label: 'Baseball',
    emoji: '⚾',
    className: 'left-[22%] bottom-[14%] rotate-[-3deg]',
  },
  {
    label: 'MMA',
    emoji: '🥊',
    className: 'right-[12%] bottom-[12%] rotate-[9deg]',
  },
] as const;

/**
 * Floating sport chips for the Discover hero collage (PO mock).
 */
export function DiscoverSportCollage({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative mx-auto h-[320px] w-full max-w-[420px] sm:h-[380px] lg:h-[420px]',
        className,
      )}
      aria-hidden
    >
      {SPORT_CARDS.map((card) => (
        <div
          key={card.label}
          className={cn(
            'absolute flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-[0_16px_40px_rgba(8,24,47,0.12)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.4)]',
            card.className,
          )}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E1F2FF] text-xl dark:bg-primary/15">
            {card.emoji}
          </span>
          <span className="text-sm font-bold tracking-tight text-foreground">{card.label}</span>
        </div>
      ))}
    </div>
  );
}
