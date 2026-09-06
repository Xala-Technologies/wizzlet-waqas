import { Link } from 'react-router-dom';
import { WizzletLogo } from '@/components/WizzletLogo';

const explore = [
  { label: 'Home', to: '/' },
  { label: 'Creators', to: '/creators' },
  { label: "Today's Events", to: '/todays-events' },
  { label: 'Network', to: '/network' },
];

const account = [
  { label: 'Log in', to: '/login' },
  { label: 'Apply for access', to: '/signup' },
  { label: 'Pricing', to: '/pricing' },
];

export function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-border">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[28rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />

      <div className="container relative py-14 md:py-16">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,0.8fr))] md:gap-10">
          <div className="max-w-sm">
            <WizzletLogo size="md" />
            <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
              Private betting infrastructure for creators who treat their edge like a business —
              subscriptions, gated picks, and payouts in one place.
            </p>
            <p className="mt-6 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">
              Invite-only · Manually reviewed
            </p>
          </div>

          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/80">
              Explore
            </p>
            <ul className="space-y-2.5">
              {explore.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/80">
              Account
            </p>
            <ul className="space-y-2.5">
              {account.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="mailto:support@wizzlet.com"
                  className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-muted-foreground">© {new Date().getFullYear()} Wizzlet</p>
          <p className="text-[12px] text-muted-foreground/70">
            Built for serious creators — not everyone.
          </p>
        </div>
      </div>
    </footer>
  );
}
