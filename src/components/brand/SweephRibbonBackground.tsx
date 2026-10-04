import { useId } from 'react';
import { cn } from '@/lib/utils';

type SweephRibbonVariant = 'home' | 'discover' | 'auth';

type SweephRibbonBackgroundProps = {
  variant?: SweephRibbonVariant;
  className?: string;
};

/**
 * Soft Sweeph ribbon / wave field for marketing heroes.
 * Light: soft white + cyan ribbons. Dark: page navy + deeper blue glow.
 */
export function SweephRibbonBackground({
  variant = 'home',
  className,
}: SweephRibbonBackgroundProps) {
  const discover = variant === 'discover';
  const auth = variant === 'auth';
  const uid = useId().replace(/:/g, '');

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden
    >
      {/* Base plane */}
      <div
        className={cn(
          'absolute inset-0',
          auth ? 'bg-[#CDE9FA] dark:bg-background' : 'bg-background',
        )}
      />

      {auth ? (
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            background:
              'linear-gradient(180deg, #D4EEFF 0%, #B5E1FF 40%, #9ED6FF 70%, #B5E1FF 100%)',
          }}
        />
      ) : null}
      <div
        className="absolute inset-0 hidden dark:block bg-[radial-gradient(ellipse_at_75%_20%,rgba(101,184,247,0.18),transparent_55%),radial-gradient(ellipse_at_90%_70%,rgba(98,226,236,0.08),transparent_50%)]"
      />

      {/* Light-mode ribbon SVG */}
      <svg
        className={cn(
          'absolute h-full w-[140%] max-w-none dark:hidden',
          auth
            ? '-right-[6%] top-0 h-full opacity-100'
            : discover
              ? '-right-[10%] top-[-20%] opacity-90'
              : '-right-[8%] top-[-18%] opacity-95',
        )}
        viewBox="0 0 1200 700"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio={auth ? 'none' : 'xMaxYMid slice'}
      >
        <defs>
          <linearGradient id={`ribbonA-${uid}`} x1="200" y1="100" x2="1100" y2="600" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#DDF3FF" stopOpacity="0.15" />
            <stop offset="45%" stopColor="#BFE8FF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#74CCFF" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id={`ribbonB-${uid}`} x1="100" y1="400" x2="1000" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#DDF3FF" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#74CCFF" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#62E2EC" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id={`ribbonC-${uid}`} x1="400" y1="600" x2="1200" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#BFE8FF" stopOpacity="0.08" />
            <stop offset="60%" stopColor="#74CCFF" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#62E2EC" stopOpacity="0.18" />
          </linearGradient>
          <filter id={`ribbonBlur-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="28" />
          </filter>
        </defs>

        <g filter={`url(#ribbonBlur-${uid})`}>
          <path
            d="M-40 420 C180 380 260 220 420 260 C620 310 700 480 920 420 C1080 370 1180 220 1280 180 L1280 720 L-40 720 Z"
            fill={`url(#ribbonA-${uid})`}
          />
          <path
            d="M80 560 C280 500 360 340 540 300 C760 250 820 420 1040 380 C1160 350 1240 250 1320 200 L1320 -40 L80 -40 Z"
            fill={`url(#ribbonB-${uid})`}
          />
          <path
            d="M200 680 C380 600 520 480 700 500 C900 530 980 360 1180 280 C1260 250 1320 220 1380 180 L1380 760 L200 760 Z"
            fill={`url(#ribbonC-${uid})`}
          />
        </g>

        <path
          d="M300 380 C480 300 560 220 720 260 C900 310 980 420 1180 340"
          stroke="#74CCFF"
          strokeOpacity="0.35"
          strokeWidth="48"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M340 420 C520 340 620 280 780 320 C960 370 1040 460 1220 390"
          stroke="#62E2EC"
          strokeOpacity="0.22"
          strokeWidth="28"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Dark-mode ribbon SVG — deeper blues, lower opacity */}
      <svg
        className={cn(
          'absolute hidden h-full w-[140%] max-w-none dark:block',
          auth
            ? '-right-[6%] top-0 h-full opacity-80'
            : discover
              ? '-right-[10%] top-[-20%] opacity-70'
              : '-right-[8%] top-[-18%] opacity-75',
        )}
        viewBox="0 0 1200 700"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio={auth ? 'none' : 'xMaxYMid slice'}
      >
        <defs>
          <linearGradient id={`ribbonDA-${uid}`} x1="200" y1="100" x2="1100" y2="600" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#65B8F7" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#429FF0" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#65B8F7" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id={`ribbonDB-${uid}`} x1="100" y1="400" x2="1000" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#203954" stopOpacity="0.2" />
            <stop offset="55%" stopColor="#65B8F7" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#62E2EC" stopOpacity="0.08" />
          </linearGradient>
          <filter id={`ribbonDBlur-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="36" />
          </filter>
        </defs>

        <g filter={`url(#ribbonDBlur-${uid})`}>
          <path
            d="M-40 420 C180 380 260 220 420 260 C620 310 700 480 920 420 C1080 370 1180 220 1280 180 L1280 720 L-40 720 Z"
            fill={`url(#ribbonDA-${uid})`}
          />
          <path
            d="M80 560 C280 500 360 340 540 300 C760 250 820 420 1040 380 C1160 350 1240 250 1320 200 L1320 -40 L80 -40 Z"
            fill={`url(#ribbonDB-${uid})`}
          />
        </g>

        <path
          d="M300 380 C480 300 560 220 720 260 C900 310 980 420 1180 340"
          stroke="#65B8F7"
          strokeOpacity="0.2"
          strokeWidth="40"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Keep left readable for copy — skip the white wash on full-height auth */}
      {auth ? null : (
        <div
          className={cn(
            'absolute inset-y-0 left-0 bg-gradient-to-r from-background via-background/90 to-transparent',
            discover ? 'w-[42%] sm:w-[38%]' : 'w-[48%] sm:w-[44%]',
          )}
        />
      )}

      {/* Soft fade into the page below — skip on full-height auth panels */}
      {auth ? null : (
        <>
          <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-b from-transparent via-background/70 to-background" />
          <div className="absolute inset-x-0 bottom-0 h-[28%] bg-gradient-to-b from-transparent to-background" />
        </>
      )}
    </div>
  );
}
