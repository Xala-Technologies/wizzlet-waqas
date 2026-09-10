import { Link } from 'react-router-dom';
import { PrizeletLogo } from '@/components/PrizeletLogo';

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
    <footer className="relative mt-auto border-t border-border bg-background">
      <div className="container relative py-14 md:py-16">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,0.8fr))] md:gap-10">
          <div className="max-w-sm">
            <PrizeletLogo size="md" />
            <p className="mt-4 text-ui leading-relaxed text-muted-foreground">
              Private creator infrastructure for people who treat their work like a business —
              subscriptions, gated content, and payouts in one place.
            </p>
            <p className="mt-6 text-caption uppercase tracking-[0.18em] text-muted-foreground/60">
              Invite-only · Manually reviewed
            </p>
          </div>

          <div>
            <p className="mb-4 text-caption font-semibold uppercase tracking-[0.16em] text-foreground/80">
              Explore
            </p>
            <ul className="space-y-2.5">
              {explore.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-support text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-caption font-semibold uppercase tracking-[0.16em] text-foreground/80">
              Account
            </p>
            <ul className="space-y-2.5">
              {account.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-support text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="mailto:support@prizelet.com"
                  className="text-support text-muted-foreground transition-colors hover:text-foreground"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-support text-muted-foreground">© {new Date().getFullYear()} Prizelet</p>
          <p className="text-support text-muted-foreground/70">
            Built for serious creators — not everyone.
          </p>
        </div>
      </div>
    </footer>
  );
}
