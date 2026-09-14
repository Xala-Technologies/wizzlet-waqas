import { ReactNode } from 'react';
import { PrizeletLogo } from '@/components/PrizeletLogo';
import { Seo } from '@/components/Seo';
import { cn } from '@/lib/utils';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  seoTitle: string;
  seoDescription: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Login/signup use sm; role selection uses lg. */
  width?: 'sm' | 'lg';
  logoSize?: 'md' | 'lg';
  /** Empty string disables link (e.g. select-role while authenticated). */
  logoLinkTo?: string;
  banner?: ReactNode;
}

/**
 * Shared auth layout — solid Prizelet surfaces, one primary task.
 * Page = muted; panel = card + border. No extra brand colors or gradients.
 */
export function AuthShell({
  title,
  subtitle,
  seoTitle,
  seoDescription,
  children,
  footer,
  width = 'sm',
  logoSize = 'md',
  logoLinkTo = '/',
  banner,
}: AuthShellProps) {
  return (
    <main
      id="main-content"
      className="min-h-screen flex items-center justify-center bg-muted px-4 py-12 sm:py-16"
    >
      <Seo title={seoTitle} description={seoDescription} noindex />
      <div className={cn('w-full', width === 'sm' ? 'max-w-[400px]' : 'max-w-lg')}>
        <header className="mb-8 text-center">
          <PrizeletLogo
            size={logoSize === 'lg' ? 'lg' : 'md'}
            linkTo={logoLinkTo}
            className="mb-8 justify-center"
          />
          <h1
            className={cn(
              'font-bold tracking-tight text-foreground',
              width === 'lg' ? 'text-heading' : 'text-2xl sm:text-[1.75rem] leading-tight',
            )}
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-support leading-relaxed text-muted-foreground">{subtitle}</p>
          ) : null}
          {banner}
        </header>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">{children}</div>

        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </main>
  );
}
