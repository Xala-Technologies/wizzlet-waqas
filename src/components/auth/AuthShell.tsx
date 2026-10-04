import { ReactNode } from 'react';
import { SweephLogo } from '@/components/SweephLogo';
import { Seo } from '@/components/Seo';
import { AuthWizardProgress } from '@/components/auth/AuthWizardProgress';
import { SweephRibbonBackground } from '@/components/brand/SweephRibbonBackground';
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
  /** 1-based funnel step; omit on login. */
  progressStep?: number;
  progressTotal?: number;
}

/**
 * Auth / onboarding shell — Sweeph brand panel + a single primary task.
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
  progressStep,
  progressTotal,
}: AuthShellProps) {
  return (
    <main
      id="main-content"
      className="relative min-h-dvh bg-background lg:grid lg:grid-cols-[minmax(280px,42%)_1fr]"
    >
      <Seo title={seoTitle} description={seoDescription} noindex />

      <aside className="relative hidden overflow-hidden border-b border-border lg:flex lg:min-h-dvh lg:flex-col lg:justify-between lg:border-b-0 lg:border-r lg:px-12 lg:py-12 xl:px-16">
        <SweephRibbonBackground variant="home" />
        <div className="relative z-[1]">
          <SweephLogo
            size={logoSize === 'lg' ? 'lg' : 'md'}
            linkTo={logoLinkTo}
          />
          <p className="mt-14 max-w-[22rem] text-[1.65rem] font-semibold leading-[1.25] tracking-tight text-foreground">
            Private creator infrastructure.
          </p>
          <p className="mt-4 max-w-[22rem] text-[15px] leading-relaxed text-muted-foreground">
            Sell access, keep your list, and run memberships in one place. You can change these
            details later.
          </p>
        </div>
        <ul className="relative z-[1] mt-16 space-y-3 text-[13px] leading-snug text-muted-foreground">
          <li className="flex gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
            Password, X, or Discord — no extra accounts to invent.
          </li>
          <li className="flex gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
            Creators set a page; members subscribe when they are ready.
          </li>
        </ul>
      </aside>

      <section className="relative flex min-h-dvh items-center justify-center px-4 py-12 sm:px-8 sm:py-16">
        <div className="pointer-events-none absolute inset-0 lg:hidden" aria-hidden>
          <SweephRibbonBackground variant="home" className="opacity-50" />
        </div>
        <div
          className={cn(
            'relative z-[1] w-full',
            width === 'sm' ? 'max-w-[420px]' : 'max-w-[480px]',
          )}
        >
          <header className="mb-8 lg:hidden">
            <SweephLogo
              size="md"
              linkTo={logoLinkTo}
              className="mb-8 justify-start"
            />
          </header>

          {progressStep != null ? (
            <AuthWizardProgress step={progressStep} total={progressTotal} />
          ) : null}

          <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[1.85rem]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>
          ) : null}
          {banner}

          <div className="mt-8">{children}</div>

          {footer ? <div className="mt-8">{footer}</div> : null}
        </div>
      </section>
    </main>
  );
}
