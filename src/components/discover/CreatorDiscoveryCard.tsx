import type { CSSProperties, MouseEventHandler } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Bookmark } from 'lucide-react';
import { creatorProfilePath } from '@/lib/creatorProfilePath';
import { cn } from '@/lib/utils';

export type CreatorDiscoveryCardProps = {
  username: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  /** Initials when no avatar (defaults to first letter of name). */
  avatarInitials?: string | null;
  bannerUrl?: string | null;
  /** Gradient fallback when no banner (Tailwind from-via-to classes). */
  bannerTone?: string | null;
  /** Primary sport label under the name. */
  sportLabel?: string | null;
  monthlyPriceCents?: number | null;
  verificationStatus?: string | null;
  postCount: number;
  rank?: number;
  activityNoun?: 'post' | 'pick';
  subscribed?: boolean;
  bookmarked?: boolean;
  onBookmarkClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  style?: CSSProperties;
};

function coverTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const tones = [
    'from-emerald-800 via-emerald-600 to-lime-500',
    'from-orange-800 via-orange-600 to-amber-400',
    'from-sky-900 via-sky-600 to-cyan-400',
    'from-indigo-950 via-violet-700 to-purple-400',
    'from-red-900 via-red-600 to-rose-400',
    'from-blue-900 via-blue-600 to-indigo-400',
  ];
  return tones[hash % tones.length] ?? tones[0]!;
}

/**
 * Discover creator card — banner media, overlapping avatar, sport + Join CTA (PO mock).
 */
export function CreatorDiscoveryCard({
  username,
  displayName,
  bio,
  avatarUrl,
  avatarInitials,
  bannerUrl,
  bannerTone,
  sportLabel,
  verificationStatus,
  subscribed = false,
  bookmarked = false,
  onBookmarkClick,
  className,
  style,
}: CreatorDiscoveryCardProps) {
  const name = displayName?.trim() || username;
  const initial = (avatarInitials?.trim() || name[0]?.toUpperCase() || '?').slice(0, 2);
  const verified = verificationStatus === 'verified';
  const trimmedBio = bio?.trim() ?? '';
  const gradient = bannerTone?.trim() || coverTone(username);

  return (
    <li className={cn('list-none h-full', className)} style={style}>
      <div className="relative h-full">
        <Link
          to={creatorProfilePath(username)}
          className={cn(
            'group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card',
            'shadow-[0_8px_28px_rgba(8,24,47,0.06)] transition-[border-color,box-shadow,transform] duration-200',
            'hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_16px_40px_rgba(8,24,47,0.1)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
        >
          <div className="relative shrink-0">
            <div className="relative aspect-[16/10] overflow-hidden bg-muted">
              {bannerUrl ? (
                <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div
                  className={cn('h-full w-full bg-gradient-to-br', gradient)}
                  aria-hidden
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
            </div>

            {subscribed ? (
              <span className="absolute left-3 top-3 z-10 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                Subscribed
              </span>
            ) : null}

            <div className="absolute -bottom-7 left-5 z-10 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-[3px] border-card bg-[#08182F] text-sm font-bold text-white shadow-md">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span aria-hidden>{initial}</span>
              )}
            </div>
          </div>

          <div className="relative flex flex-1 flex-col px-5 pb-5 pt-10">
            <div className="flex min-w-0 items-center gap-1.5">
              <h2 className="truncate text-lg font-extrabold tracking-tight text-foreground">
                {name}
              </h2>
              {verified ? (
                <BadgeCheck className="h-5 w-5 shrink-0 text-[#429FF0]" aria-label="Verified" />
              ) : null}
            </div>
            {sportLabel ? (
              <p className="mt-0.5 text-sm font-medium text-muted-foreground">{sportLabel}</p>
            ) : (
              <p className="mt-0.5 text-sm font-medium text-muted-foreground">@{username}</p>
            )}

            <p
              className={cn(
                'mt-3 min-h-[2.75rem] text-sm leading-relaxed',
                trimmedBio ? 'line-clamp-2 text-foreground/75' : 'text-muted-foreground',
              )}
            >
              {trimmedBio || 'Open the profile for products, posts, and pricing.'}
            </p>

            <div className="mt-auto pt-5">
              <span
                className={cn(
                  'flex h-11 w-full items-center justify-between rounded-full bg-[#E1F2FF] px-5',
                  'text-sm font-bold text-[#256DC1]',
                  'transition-colors duration-200 group-hover:bg-[#429FF0] group-hover:text-white',
                )}
              >
                Join
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </div>
          </div>
        </Link>

        {onBookmarkClick ? (
          <button
            type="button"
            onClick={onBookmarkClick}
            aria-label={bookmarked ? `Remove ${name} from bookmarks` : `Bookmark ${name}`}
            className={cn(
              'absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm',
              'transition-colors hover:border-primary/40 hover:text-primary',
              bookmarked && 'text-primary',
            )}
          >
            <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-current')} aria-hidden />
          </button>
        ) : null}
      </div>
    </li>
  );
}

export function CreatorDiscoveryCardSkeleton({ className }: { className?: string }) {
  return (
    <li
      className={cn('h-full overflow-hidden rounded-3xl border border-border bg-card', className)}
      aria-hidden
    >
      <div className="aspect-[16/10] animate-pulse bg-muted" />
      <div className="space-y-3 px-5 pb-5 pt-10">
        <div className="h-5 w-36 animate-pulse rounded bg-muted" />
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
        <div className="h-11 w-full animate-pulse rounded-full bg-muted" />
      </div>
    </li>
  );
}
