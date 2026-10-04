import { Link } from 'react-router-dom';
import { SweephLogo } from '@/components/SweephLogo';

const columns = [
  {
    title: 'Sweeph',
    links: [
      { label: 'About', to: '/community' },
      { label: 'Become a Creator', to: '/signup' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Help Center', to: '/support' },
      { label: 'Contact Support', to: '/support' },
      { label: 'Feature Requests', to: '/community' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', to: '/support' },
      { label: 'Privacy Policy', to: '/support' },
      { label: 'Refund Policy', to: '/support' },
    ],
  },
] as const;

const socials = [
  { label: 'X', href: 'https://x.com', icon: XMark },
  { label: 'Instagram', href: 'https://instagram.com', icon: InstagramMark },
  { label: 'TikTok', href: 'https://tiktok.com', icon: TikTokMark },
  { label: 'Discord', href: 'https://discord.com', icon: DiscordMark },
] as const;

function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className ?? ''} text-[#0F1419] dark:text-white`} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <radialGradient id="ig-footer" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <path
        fill="url(#ig-footer)"
        d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 3.2A4.8 4.8 0 1 1 7.2 12 4.8 4.8 0 0 1 12 7.2Zm0 2A2.8 2.8 0 1 0 14.8 12 2.8 2.8 0 0 0 12 9.2ZM17.35 6.15a1.1 1.1 0 1 1-1.1 1.1 1.1 1.1 0 0 1 1.1-1.1Z"
      />
    </svg>
  );
}

function TikTokMark({ className }: { className?: string }) {
  const note =
    'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.88 2.89 2.89 0 0 1 2.88-2.88c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.04a8.27 8.27 0 0 0 4.83 1.55V7.14a4.84 4.84 0 0 1-1.07-.45Z';
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#25F4EE" d={note} transform="translate(-0.9,0.6)" />
      <path fill="#FE2C55" d={note} transform="translate(0.9,-0.6)" />
      <path fill="#000000" d={note} />
    </svg>
  );
}

function DiscordMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#5865F2" aria-hidden>
      <path d="M19.27 5.33A17.4 17.4 0 0 0 14.94 4l-.3.55a16.1 16.1 0 0 1 3.13.84 16.6 16.6 0 0 0-13.54 0A16 16 0 0 1 7.36 4L7.06 4a17.4 17.4 0 0 0-4.33 1.33C.46 9.05-.28 12.66.09 16.22A17.6 17.6 0 0 0 5.4 19.1l.72-.96a11.4 11.4 0 0 1-1.8-.86l.36-.27c3.57 1.67 7.44 1.67 11.01 0l.36.27c-.57.34-1.17.63-1.8.86l.72.96a17.6 17.6 0 0 0 5.31-2.88c.43-4.02-.73-7.6-1.71-10.89ZM8.02 14.53c-1.07 0-1.95-.98-1.95-2.18s.86-2.18 1.95-2.18 1.97.98 1.95 2.18c0 1.2-.86 2.18-1.95 2.18Zm7.96 0c-1.07 0-1.95-.98-1.95-2.18s.86-2.18 1.95-2.18 1.97.98 1.95 2.18c0 1.2-.86 2.18-1.95 2.18Z" />
    </svg>
  );
}

/** White marketing footer — logo, socials, Sweeph / Help / Legal (PO mock). */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="container py-12 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_repeat(3,minmax(0,0.7fr))] lg:gap-8">
          <div>
            <SweephLogo size="md" variant="auto" />
            <div className="mt-6 flex items-center gap-2.5">
              {socials.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background transition-colors hover:border-border/80 hover:bg-muted/40"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title} className="lg:border-l lg:border-border lg:pl-8">
              <p className="mb-4 text-sm font-bold text-foreground">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Sweeph. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
