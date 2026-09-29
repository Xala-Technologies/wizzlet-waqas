import { BadgeCheck, BarChart3, DollarSign, TrendingUp, Trophy, Users } from 'lucide-react';

const AVATARS = [
  'https://api.dicebear.com/9.x/adventurer/png?seed=AlexPicks&size=160&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/adventurer/png?seed=FitnessBySara&size=160&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/adventurer/png?seed=Maya&size=80&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/adventurer/png?seed=Jordan&size=80&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/adventurer/png?seed=Sam&size=80&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/adventurer/png?seed=Riley&size=80&backgroundColor=c0aede',
];

function MiniAvatars({ seeds }: { seeds: string[] }) {
  return (
    <div className="flex -space-x-1.5">
      {seeds.map((src) => (
        <img
          key={src}
          src={src}
          alt=""
          className="h-6 w-6 rounded-full border-2 border-white object-cover"
        />
      ))}
    </div>
  );
}

/**
 * Decorative floating product cards for the home hero — spaced so cards never stack.
 */
export function HomeHeroCollage() {
  return (
    <div
      className="relative mx-auto h-[420px] w-full max-w-[560px] sm:h-[500px] lg:h-[540px] lg:max-w-none"
      aria-hidden
    >
      {/* Soft depth plate behind cards */}
      <div className="absolute left-[12%] top-[10%] h-[70%] w-[70%] rounded-[2.5rem] bg-[#E1F2FF]/45 blur-0" />

      {/* —— Left creator card (AlexPicks) —— */}
      <div className="absolute left-0 top-[6%] z-10 w-[46%] max-w-[230px] rotate-[-6deg] rounded-[1.75rem] border border-white bg-white p-4 shadow-[0_24px_60px_rgba(8,24,47,0.14)] sm:left-[2%] sm:p-5">
        <div className="mx-auto h-[76px] w-[76px] overflow-hidden rounded-full ring-4 ring-[#E1F2FF] sm:h-[88px] sm:w-[88px]">
          <img src={AVATARS[0]} alt="" className="h-full w-full object-cover" />
        </div>
        <p className="mt-3 text-center text-base font-extrabold tracking-tight text-[#08182F]">
          AlexPicks
        </p>
        <p className="text-center text-caption font-medium text-muted-foreground">Creator</p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <MiniAvatars seeds={AVATARS.slice(2, 6)} />
          <p className="text-[11px] font-semibold text-muted-foreground">12.4K members</p>
        </div>
        <div className="mt-4 flex h-10 w-full items-center justify-center rounded-full bg-[#429FF0] text-sm font-semibold text-white">
          Join
        </div>
        <p className="mt-2 text-center text-[11px] font-medium text-muted-foreground">$49 / month</p>
      </div>

      {/* —— Right creator card (FitnessBySara) —— avatar as circle, not stretched banner */}
      <div className="absolute right-0 top-[22%] z-10 w-[44%] max-w-[220px] rotate-[5deg] rounded-[1.75rem] border border-white bg-white shadow-[0_24px_60px_rgba(8,24,47,0.14)] sm:right-[4%]">
        <div className="relative h-[88px] overflow-hidden rounded-t-[1.75rem] bg-gradient-to-br from-[#BFE8FF] via-[#74CCFF] to-[#429FF0] sm:h-[96px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.45),transparent_55%)]" />
        </div>
        <div className="relative px-3.5 pb-3.5 pt-0 sm:px-4 sm:pb-4">
          <div className="-mt-9 mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-[#c0aede] shadow-md">
            <img
              src={AVATARS[1]}
              alt=""
              className="h-full w-full object-cover object-center"
            />
          </div>
          <p className="flex items-center gap-1 text-sm font-extrabold tracking-tight text-[#08182F]">
            FitnessBySara
            <BadgeCheck className="h-4 w-4 text-[#429FF0]" aria-hidden />
          </p>
          <p className="text-caption font-medium text-muted-foreground">Creator</p>
          <div className="mt-2 flex items-center gap-2">
            <MiniAvatars seeds={AVATARS.slice(3, 6)} />
            <p className="text-[11px] font-semibold text-muted-foreground">8.2K members</p>
          </div>
          <div className="mt-3 flex h-9 w-full items-center justify-center rounded-full bg-[#429FF0] text-sm font-semibold text-white">
            Join
          </div>
          <p className="mt-1.5 text-center text-[11px] font-medium text-muted-foreground">
            $29 / month
          </p>
        </div>
      </div>

      {/* Floating chips — parked in open corners, not over faces */}
      <div className="absolute right-[6%] top-0 z-20 flex items-center gap-2.5 rounded-2xl border border-white/90 bg-white px-3.5 py-2.5 shadow-[0_12px_40px_rgba(8,24,47,0.1)] sm:right-[10%]">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E1F2FF] text-[#429FF0]">
          <Users className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-base font-extrabold leading-none tracking-tight text-[#08182F]">25K</p>
          <p className="mt-0.5 text-[10px] font-semibold text-muted-foreground">Subscribers</p>
        </div>
      </div>

      <div className="absolute left-[48%] top-[8%] z-20 hidden -translate-x-1/2 rounded-2xl border border-white/90 bg-white px-3 py-2.5 shadow-[0_12px_32px_rgba(8,24,47,0.1)] sm:block">
        <div className="flex items-end gap-2">
          <span className="text-[11px] font-bold text-emerald-600">+32%</span>
          <span className="flex h-7 items-end gap-0.5 pb-0.5">
            {[8, 12, 10, 16, 14].map((h, i) => (
              <span key={i} className="w-1.5 rounded-full bg-[#65B8F7]" style={{ height: h }} />
            ))}
          </span>
        </div>
      </div>

      <div className="absolute bottom-[42%] left-0 z-20 flex h-11 w-11 items-center justify-center rounded-2xl border border-white bg-white shadow-[0_10px_28px_rgba(8,24,47,0.1)] sm:left-[1%]">
        <BarChart3 className="h-5 w-5 text-[#429FF0]" aria-hidden />
      </div>

      <div className="absolute right-0 top-[48%] z-20 hidden h-11 w-11 items-center justify-center rounded-2xl border border-white bg-white shadow-[0_10px_28px_rgba(8,24,47,0.1)] sm:flex">
        <Trophy className="h-5 w-5 text-[#429FF0]" aria-hidden />
      </div>

      <div className="absolute bottom-[22%] left-[42%] z-20 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-2xl border border-white bg-white shadow-[0_10px_28px_rgba(8,24,47,0.1)]">
        <DollarSign className="h-5 w-5 text-[#429FF0]" aria-hidden />
      </div>

      {/* Earnings — bottom center-left, clear of both phones */}
      <div className="absolute bottom-0 left-[18%] z-20 w-[48%] max-w-[220px] rounded-2xl border border-white bg-white p-3.5 shadow-[0_16px_40px_rgba(8,24,47,0.12)] sm:left-[22%] sm:p-4">
        <p className="text-[11px] font-semibold text-muted-foreground">Earnings</p>
        <p className="mt-1 text-xl font-extrabold tracking-tight text-[#08182F] sm:text-2xl">
          $8,420
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden />
            +28%
          </span>
          <span className="flex h-7 items-end gap-0.5">
            {[10, 14, 12, 18, 16, 22, 20].map((h, i) => (
              <span key={i} className="w-1.5 rounded-full bg-[#65B8F7]" style={{ height: h }} />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
