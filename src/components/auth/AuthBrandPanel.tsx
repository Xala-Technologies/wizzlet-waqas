import { SweephLogo } from '@/components/SweephLogo';
import { BadgeCheck } from 'lucide-react';

/** Solid left-half color — same from top to bottom. */
export const AUTH_BRAND_PANEL_COLOR = '#B7E2FF';

const AVATAR =
  'https://api.dicebear.com/9.x/adventurer/png?seed=AlexPicks&size=160&backgroundColor=b6e3f4';
const FACES = [
  'https://api.dicebear.com/9.x/adventurer/png?seed=Maya&size=64&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/adventurer/png?seed=Jordan&size=64&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/adventurer/png?seed=Sam&size=64&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/adventurer/png?seed=Riley&size=64&backgroundColor=c0aede',
];

function CreatorPreviewCard() {
  return (
    <div
      className="mt-10 w-[17.5rem] rounded-[1.75rem] border border-border bg-card p-5 shadow-[0_12px_40px_rgba(8,24,47,0.1)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
      aria-hidden
    >
      <div className="mx-auto h-[84px] w-[84px] overflow-hidden rounded-full ring-4 ring-[#E1F2FF] dark:ring-primary/20">
        <img src={AVATAR} alt="" className="h-full w-full object-cover" />
      </div>
      <p className="mt-3 flex items-center justify-center gap-1 text-center text-[15px] font-extrabold tracking-tight text-foreground">
        AlexPicks
        <BadgeCheck className="h-4 w-4 text-[#429FF0] dark:text-primary" />
      </p>
      <p className="text-center text-[12px] font-medium text-muted-foreground">Creator</p>
      <div className="mt-3 flex items-center justify-center gap-2">
        <div className="flex -space-x-1.5">
          {FACES.map((src) => (
            <img
              key={src}
              src={src}
              alt=""
              className="h-6 w-6 rounded-full border-2 border-card object-cover"
            />
          ))}
        </div>
        <p className="text-[11px] font-semibold text-muted-foreground">12.4K members</p>
      </div>
      <div className="mt-4 flex h-10 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
        Join
      </div>
      <p className="mt-2 text-center text-[11px] font-medium text-muted-foreground">$49 / month</p>
    </div>
  );
}

export function AuthBrandPanel({
  logoSize = 'md',
  logoLinkTo = '/',
}: {
  logoSize?: 'md' | 'lg';
  logoLinkTo?: string;
}) {
  return (
    <aside
      className="relative flex h-full min-h-0 flex-col overflow-hidden dark:bg-background"
      style={{ background: AUTH_BRAND_PANEL_COLOR }}
    >
      <div
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{ background: AUTH_BRAND_PANEL_COLOR }}
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-16 top-[8%] h-[55%] w-[70%] rounded-full bg-white/25 blur-3xl dark:hidden" aria-hidden />
      <div className="relative z-[1] flex h-full flex-1 flex-col px-14 py-12 xl:px-16">
        <SweephLogo size={logoSize === 'lg' ? 'lg' : 'md'} linkTo={logoLinkTo} />
        <div className="flex flex-1 flex-col justify-center py-10">
          <p className="max-w-[20rem] text-[2.6rem] font-extrabold leading-[1.05] tracking-[-0.05em] text-foreground xl:text-[2.85rem]">
            One place.
            <br />
            <span className="text-[#429FF0] dark:text-primary">Endless possibilities.</span>
          </p>
          <p className="mt-5 max-w-[22rem] text-[16px] leading-relaxed text-muted-foreground">
            Discover creators, join communities, and unlock exclusive content — all in one place.
          </p>
          <CreatorPreviewCard />
        </div>
      </div>
    </aside>
  );
}
