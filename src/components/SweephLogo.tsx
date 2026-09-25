import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type LogoSize = 'sm' | 'md' | 'lg' | 'sidebar';

export interface SweephLogoProps {
  size?: LogoSize;
  className?: string;
  /** Pass empty string to render without a link. */
  linkTo?: string;
  /**
   * Which lockup to show.
   * - `auto` — follows `html.dark` (public header / light surfaces)
   * - `light` — navy wordmark (use on white / light surfaces)
   * - `dark` — white wordmark (use on navy / dark sidebars)
   */
  variant?: 'auto' | 'light' | 'dark';
}

const HEIGHT: Record<LogoSize, string> = {
  sm: 'h-[var(--logo-mobile-height)]',
  md: 'h-[var(--logo-desktop-height)]',
  lg: 'h-12',
  sidebar: 'h-[var(--logo-sidebar-height)]',
};

/**
 * Official Sweeph lockup — S-symbol + serif wordmark as raster/SVG assets.
 * Never recreate the wordmark with a web font (Manrope is product UI only).
 */
export function SweephLogo({
  size = 'md',
  className,
  linkTo = '/',
  variant = 'auto',
}: SweephLogoProps) {
  const heightClass = HEIGHT[size];
  const imgClass = cn('block w-auto max-w-none object-contain object-left select-none', heightClass);

  const content = (
    <span className={cn('relative inline-flex shrink-0 items-center', className)}>
      {/* Light lockup: navy wordmark */}
      <img
        src="/brand/sweeph-logo-light.png"
        alt=""
        aria-hidden={variant === 'dark' ? true : undefined}
        className={cn(
          imgClass,
          variant === 'dark' && 'hidden',
          variant === 'auto' && 'dark:hidden',
        )}
        width={761}
        height={263}
        decoding="async"
        draggable={false}
      />
      {/* Dark lockup: white wordmark */}
      <img
        src="/brand/sweeph-logo-dark.png"
        alt=""
        aria-hidden={variant === 'light' ? true : undefined}
        className={cn(
          imgClass,
          variant === 'light' && 'hidden',
          variant === 'auto' && 'hidden dark:block',
          variant === 'dark' && 'block',
        )}
        width={766}
        height={269}
        decoding="async"
        draggable={false}
      />
      <span className="sr-only">Sweeph</span>
    </span>
  );

  if (linkTo) {
    return (
      <Link
        to={linkTo}
        className="inline-flex shrink-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-[var(--radius-sm)]"
        aria-label="Sweeph home"
      >
        {content}
      </Link>
    );
  }

  return content;
}
