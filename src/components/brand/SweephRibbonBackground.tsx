import { cn } from '@/lib/utils';

type SweephRibbonVariant = 'home' | 'discover';

type SweephRibbonBackgroundProps = {
  variant?: SweephRibbonVariant;
  className?: string;
};

/**
 * Soft Sweeph ribbon / wave field for marketing heroes.
 * Left stays mostly white for copy; strongest blues sit mid→right.
 */
export function SweephRibbonBackground({
  variant = 'home',
  className,
}: SweephRibbonBackgroundProps) {
  const discover = variant === 'discover';

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden
    >
      <div className="absolute inset-0 bg-white dark:bg-[var(--bg-page)]" />
      <svg
        className={cn(
          'absolute h-full w-[140%] max-w-none',
          discover ? '-right-[10%] top-[-20%] opacity-90' : '-right-[8%] top-[-18%] opacity-95',
        )}
        viewBox="0 0 1200 700"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMaxYMid slice"
      >
        <defs>
          <linearGradient id="sweephRibbonA" x1="200" y1="100" x2="1100" y2="600" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#DDF3FF" stopOpacity="0.15" />
            <stop offset="45%" stopColor="#BFE8FF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#74CCFF" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="sweephRibbonB" x1="100" y1="400" x2="1000" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#DDF3FF" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#74CCFF" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#62E2EC" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id="sweephRibbonC" x1="400" y1="600" x2="1200" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#BFE8FF" stopOpacity="0.08" />
            <stop offset="60%" stopColor="#74CCFF" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#62E2EC" stopOpacity="0.18" />
          </linearGradient>
          <filter id="sweephRibbonBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="28" />
          </filter>
        </defs>

        <g filter="url(#sweephRibbonBlur)" className="dark:opacity-40">
          <path
            d="M-40 420 C180 380 260 220 420 260 C620 310 700 480 920 420 C1080 370 1180 220 1280 180 L1280 720 L-40 720 Z"
            fill="url(#sweephRibbonA)"
          />
          <path
            d="M80 560 C280 500 360 340 540 300 C760 250 820 420 1040 380 C1160 350 1240 250 1320 200 L1320 -40 L80 -40 Z"
            fill="url(#sweephRibbonB)"
          />
          <path
            d="M200 680 C380 600 520 480 700 500 C900 530 980 360 1180 280 C1260 250 1320 220 1380 180 L1380 760 L200 760 Z"
            fill="url(#sweephRibbonC)"
          />
        </g>

        {/* Sharper mid ribbon — subtle S sweep */}
        <path
          className="dark:opacity-30"
          d="M300 380 C480 300 560 220 720 260 C900 310 980 420 1180 340"
          stroke="#74CCFF"
          strokeOpacity="0.35"
          strokeWidth="48"
          strokeLinecap="round"
          fill="none"
        />
        <path
          className="dark:opacity-25"
          d="M340 420 C520 340 620 280 780 320 C960 370 1040 460 1220 390"
          stroke="#62E2EC"
          strokeOpacity="0.22"
          strokeWidth="28"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Keep left readable for copy */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 bg-gradient-to-r from-white via-white/90 to-transparent dark:from-[var(--bg-page)] dark:via-[var(--bg-page)]/85',
          discover ? 'w-[42%] sm:w-[38%]' : 'w-[48%] sm:w-[44%]',
        )}
      />

      {/* Soft fade into the white page below — avoids a hard blue cutoff */}
      <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-b from-transparent via-white/70 to-white dark:via-[var(--bg-page)]/70 dark:to-[var(--bg-page)]" />
      <div className="absolute inset-x-0 bottom-0 h-[28%] bg-gradient-to-b from-transparent to-white dark:to-[var(--bg-page)]" />
    </div>
  );
}
