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
 * Shared centered auth layout — single column, flat surface, one primary task.
 * Does not introduce a new visual language; aligns Login / Signup / SelectRole.
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
      className="min-h-screen flex items-center justify-center px-4 bg-background"
    >
      <Seo title={seoTitle} description={seoDescription} noindex />
      <div className={cn('w-full', width === 'sm' ? 'max-w-[380px]' : 'max-w-lg')}>
        <div className="text-center mb-10">
          <PrizeletLogo
            size={logoSize}
            linkTo={logoLinkTo}
            className={cn('justify-center', logoSize === 'lg' ? 'mb-6' : 'mb-8')}
          />
          <h1
            className={cn(
              'font-bold tracking-tight text-foreground',
              width === 'lg' ? 'text-heading' : 'text-title-lg',
            )}
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="text-support text-muted-foreground mt-1.5">{subtitle}</p>
          ) : null}
          {banner}
        </div>
        {children}
        {footer}
      </div>
    </main>
  );
}
