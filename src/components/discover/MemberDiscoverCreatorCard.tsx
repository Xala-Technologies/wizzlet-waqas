import { Link } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import { creatorProfilePath } from '@/lib/creatorProfilePath';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type MemberDiscoverCreatorCardProps = {
  rank: number;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl?: string | null;
  avatarInitials?: string;
  bannerUrl?: string | null;
  bannerTone?: string;
  bannerEmoji?: string;
  sports: string[];
  winRate: number;
  profit30dUnits: number;
  followersLabel: string;
  monthlyPriceCents: number;
  verified?: boolean;
  className?: string;
};

export function MemberDiscoverCreatorCard({
  rank,
  username,
  displayName,
  bio,
  avatarUrl,
  avatarInitials,
  bannerUrl,
  bannerTone = 'from-slate-700 via-slate-600 to-slate-900',
  bannerEmoji = '🏆',
  sports,
  winRate,
  profit30dUnits,
  followersLabel,
  monthlyPriceCents,
  verified = true,
  className,
}: MemberDiscoverCreatorCardProps) {
  const initials =
    avatarInitials ||
    displayName
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  const price = `$${(monthlyPriceCents / 100).toFixed(monthlyPriceCents % 100 === 0 ? 0 : 2)}/month`;
  const profitPositive = profit30dUnits >= 0;
  const profitLabel = `${profitPositive ? '+' : ''}${profit30dUnits.toFixed(1)}u`;

  return (
    <li className={cn('list-none h-full', className)}>
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
        <div className="relative aspect-[16/9] shrink-0 overflow-hidden bg-slate-800">
          {bannerUrl ? (
            <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className={cn(
                'flex h-full w-full items-center justify-center bg-gradient-to-br',
                bannerTone,
              )}
              aria-hidden
            >
              <span className="text-5xl drop-shadow-lg">{bannerEmoji}</span>
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-900 shadow-sm">
            #{rank}
          </span>
        </div>

        <div className="flex flex-1 flex-col px-4 pb-4 pt-0">
          <div className="-mt-7 mb-3 flex items-end gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-14 w-14 rounded-full border-4 border-white object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-slate-900 text-sm font-bold text-white shadow-sm">
                {initials}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-[15px] font-bold text-slate-900">{displayName}</h3>
              {verified ? (
                <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified" />
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-snug text-slate-500">{bio}</p>
          </div>

          {sports.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {sports.slice(0, 3).map((sport) => (
                <span
                  key={sport}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                >
                  {sport}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
            <div>
              <p className="text-sm font-extrabold tabular-nums text-slate-900">{winRate}%</p>
              <p className="text-[11px] font-medium text-slate-400">Win Rate</p>
            </div>
            <div>
              <p
                className={cn(
                  'text-sm font-extrabold tabular-nums',
                  profitPositive ? 'text-emerald-600' : 'text-rose-600',
                )}
              >
                {profitLabel}
              </p>
              <p className="text-[11px] font-medium text-slate-400">Profit (30d)</p>
            </div>
            <div>
              <p className="text-sm font-extrabold tabular-nums text-slate-900">
                {followersLabel}
              </p>
              <p className="text-[11px] font-medium text-slate-400">Followers</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <p className="text-sm font-bold text-slate-900">{price}</p>
            <Button asChild size="sm" className="h-9 rounded-xl px-3.5 font-semibold">
              <Link to={creatorProfilePath(username)}>View Profile</Link>
            </Button>
          </div>
        </div>
      </article>
    </li>
  );
}

export function MemberDiscoverCreatorCardSkeleton() {
  return (
    <li className="list-none overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="aspect-[16/9] animate-pulse bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
      </div>
    </li>
  );
}
