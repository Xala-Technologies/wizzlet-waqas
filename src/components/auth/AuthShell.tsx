import { ReactNode, useLayoutEffect } from 'react';
import { SweephLogo } from '@/components/SweephLogo';
import { Seo } from '@/components/Seo';
import { AuthBrandPanel, AUTH_BRAND_PANEL_COLOR } from '@/components/auth/AuthBrandPanel';
import { AuthWizardProgress } from '@/components/auth/AuthWizardProgress';
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
 * Auth / onboarding shell — left half brand blue, right half form surface.
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
  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const mq = window.matchMedia('(min-width: 1024px)');

    const clear = () => {
      html.style.removeProperty('height');
      html.style.removeProperty('background');
      body.style.removeProperty('height');
      body.style.removeProperty('min-height');
      body.style.removeProperty('background');
      body.style.removeProperty('background-color');
      body.style.removeProperty('overflow');
      if (root) {
        root.style.removeProperty('height');
        root.style.removeProperty('min-height');
      }
    };

    const apply = () => {
      if (!mq.matches) {
        clear();
        return;
      }
      html.style.height = '100%';
      html.style.background = `linear-gradient(to right, ${AUTH_BRAND_PANEL_COLOR} 50%, hsl(var(--background)) 50%)`;
      body.style.height = '100%';
      body.style.minHeight = '100%';
      body.style.setProperty('background', 'transparent', 'important');
      body.style.setProperty('background-color', 'transparent', 'important');
      body.style.overflow = 'hidden';
      if (root) {
        root.style.height = '100%';
        root.style.minHeight = '100%';
      }
    };

    apply();
    mq.addEventListener('change', apply);
    return () => {
      mq.removeEventListener('change', apply);
      clear();
    };
  }, []);

  return (
    <main
      id="main-content"
      className="relative min-h-svh bg-background lg:fixed lg:inset-0 lg:grid lg:h-full lg:min-h-full lg:grid-cols-2 lg:overflow-hidden"
    >
      <Seo title={seoTitle} description={seoDescription} noindex />

      <div
        className="relative hidden h-full min-h-0 lg:block"
        style={{ background: AUTH_BRAND_PANEL_COLOR }}
      >
        <AuthBrandPanel logoSize={logoSize} logoLinkTo={logoLinkTo} />
      </div>

      <section className="relative flex min-h-svh items-center justify-center bg-background px-5 py-12 sm:px-10 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:px-14 xl:px-16">
        <div
          className={cn(
            'relative z-[1] w-full',
            width === 'sm' ? 'max-w-[400px]' : 'max-w-[460px]',
          )}
        >
          <header className="mb-10 lg:hidden">
            <SweephLogo size="md" linkTo={logoLinkTo} className="mb-10 justify-start" />
          </header>

          {progressStep != null ? (
            <AuthWizardProgress step={progressStep} total={progressTotal} />
          ) : null}

          <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-foreground sm:text-[1.9rem]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>
          ) : null}
          {banner}

          <div className="mt-8">{children}</div>

          {footer ? <div className="mt-8">{footer}</div> : null}
        </div>
      </section>
    </main>
  );
}
