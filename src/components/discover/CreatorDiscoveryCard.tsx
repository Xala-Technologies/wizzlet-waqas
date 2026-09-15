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
  bannerUrl?: string | null;
  monthlyPriceCents?: number | null;
  verificationStatus?: string | null;
  postCount: number;
  /** 1-based rank when the list is ordered (optional). */
  rank?: number;
  /** Copy for the activity line — Discover uses “posts”, Creators may use “picks”. */
  activityNoun?: 'post' | 'pick';
  /** Member Discover: show active subscription chip. */
  subscribed?: boolean;
  bookmarked?: boolean;
  onBookmarkClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  style?: CSSProperties;
};

/** Distinct cover fills when no banner — solid enough that the text band pops. */
function coverTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const tones = [
    'bg-primary/40',
    'bg-foreground/25',
    'bg-primary/30',
    'bg-muted-foreground/35',
  ];
  return tones[hash % tones.length] ?? tones[0];
}

/**
 * Discover / directory card — media band + text band with overlapping avatar.
 * Solid type, larger scale; Prizelet tokens only.
 */
export function CreatorDiscoveryCard({
  username,
  displayName,
  bio,
  avatarUrl,
  bannerUrl,
  monthlyPriceCents,
  verificationStatus,
  postCount,
  rank,
  activityNoun = 'post',
  subscribed = false,
  bookmarked = false,
  onBookmarkClick,
  className,
  style,
}: CreatorDiscoveryCardProps) {
  const name = displayName?.trim() || username;
  const initial = name[0]?.toUpperCase() ?? '?';
  const verified = verificationStatus === 'verified';
  const priceLabel =
    monthlyPriceCents != null
      ? `$${(monthlyPriceCents / 100).toFixed(0)}/mo`
      : 'Tiers on profile';
  const activity =
    postCount === 1
      ? `1 ${activityNoun} published`
      : `${postCount} ${activityNoun}s published`;
  const trimmedBio = bio?.trim() ?? '';

  return (
    <li className={cn('list-none h-full', className)} style={style}>
      <div className="relative h-full">
        <Link
          to={creatorProfilePath(username)}
          className={cn(
            'group relative flex h-full flex-col rounded-2xl border border-border bg-card',
            'shadow-[var(--shadow-card)] transition-[border-color,box-shadow] duration-200 ease-out',
            'hover:border-primary/30 hover:shadow-[var(--shadow-card-hover)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          {/* MEDIA */}
          <div className="relative shrink-0">
            <div className="relative aspect-[3/2] overflow-hidden rounded-t-2xl bg-muted">
              {bannerUrl ? (
                <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className={cn('relative h-full w-full', coverTone(username))} aria-hidden>
                  <div className="absolute inset-0 bg-gradient-to-br from-background/15 via-transparent to-foreground/10" />
                </div>
              )}
            </div>

            {rank != null && rank <= 3 ? (
              <span className="absolute left-3 top-3 z-10 rounded-md border border-border bg-card px-2 py-1 text-xs font-semibold text-foreground">
                #{rank}
              </span>
            ) : null}

            {verified ? (
              <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-semibold text-foreground">
                <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
                Verified
              </span>
            ) : null}

            {subscribed ? (
              <span className="absolute bottom-3 left-3 z-10 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Subscribed
              </span>
            ) : null}
          </div>

          {/* TEXT */}
          <div className="relative flex flex-1 flex-col rounded-b-2xl border-t border-border bg-card px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
            <div className="-mt-8 mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-[3px] border-card bg-primary/15 text-xl font-bold text-primary ring-1 ring-border">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span aria-hidden>{initial}</span>
              )}
            </div>

            <p className="text-sm font-medium text-foreground/70">@{username}</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{name}</h2>

            <p
              className={cn(
                'mt-3 min-h-[3.75rem] text-base leading-relaxed',
                trimmedBio ? 'line-clamp-3 text-foreground/80' : 'text-foreground/55',
              )}
            >
              {trimmedBio || 'No public bio yet — open the profile for products and posts.'}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-foreground">
              <span>{activity}</span>
              <span className="text-border" aria-hidden>
                ·
              </span>
              <span className="font-mono tabular-nums">{priceLabel}</span>
            </div>

            <div className="mt-auto pt-6">
              <span
                className={cn(
                  'flex w-full items-center justify-between rounded-xl bg-foreground px-4 py-3.5',
                  'text-base font-semibold text-background',
                  'transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground',
                )}
              >
                View profile
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
              verified && 'top-14',
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
      className={cn('h-full overflow-hidden rounded-2xl border border-border bg-card', className)}
      aria-hidden
    >
      <div className="aspect-[3/2] animate-pulse bg-muted" />
      <div className="space-y-3 px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
        <div className="-mt-8 h-16 w-16 animate-pulse rounded-full border-[3px] border-card bg-muted" />
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-6 w-44 animate-pulse rounded bg-muted" />
        <div className="h-14 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    </li>
  );
}
