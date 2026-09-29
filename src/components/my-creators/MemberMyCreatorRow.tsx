import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  CreditCard,
  Flag,
  HelpCircle,
  MoreHorizontal,
  Settings,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { creatorProfilePath } from '@/lib/creatorProfilePath';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type MemberMyCreatorRowProps = {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl?: string | null;
  avatarInitials?: string;
  avatarTone?: string;
  /** Tags / categories shown as pills */
  tags: string[];
  /** Plan tier under the name (Premium, VIP, …) */
  planLabel: string;
  verified?: boolean;
  /** Href for Manage Subscription screen (⋯ menu) */
  manageHref?: string;
  onOpenBilling?: () => void;
  className?: string;
};

export function MemberMyCreatorRow({
  username,
  displayName,
  bio,
  avatarUrl,
  avatarInitials,
  avatarTone = 'bg-muted text-muted-foreground',
  tags,
  planLabel,
  verified = true,
  manageHref,
  onOpenBilling,
  className,
}: MemberMyCreatorRowProps) {
  const initials =
    avatarInitials ||
    displayName
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  const profileHref = creatorProfilePath(username);
  const isEmojiAvatar =
    avatarInitials === '👑' || avatarInitials === '🎾' || (avatarInitials?.length ?? 0) === 1;

  return (
    <li className={cn('list-none', className)}>
      <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <Link
            to={profileHref}
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full text-base font-bold shadow-sm sm:h-16 sm:w-16',
              !avatarUrl && avatarTone,
            )}
            aria-label={`${displayName} profile`}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className={isEmojiAvatar ? 'text-xl' : undefined}>{initials}</span>
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                to={profileHref}
                className="truncate text-[15px] font-bold text-foreground hover:underline"
              >
                {displayName}
              </Link>
              {verified ? (
                <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified" />
              ) : null}
            </div>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">{planLabel}</p>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {bio}
            </p>
            {tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:pl-2">
          <Button asChild size="sm"
          className="px-5 font-semibold">
            <Link to={profileHref}>View Content</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 text-muted-foreground"
                aria-label="More options"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[12rem]">
              <DropdownMenuItem asChild className="gap-2">
                <Link to={profileHref}>
                  <User className="h-4 w-4 text-muted-foreground" aria-hidden />
                  Creator details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onSelect={() => {
                  if (onOpenBilling) onOpenBilling();
                  else
                    toast.message('Billing information', {
                      description: 'Open the billing portal from a live subscription.',
                    });
                }}
              >
                <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden />
                Billing information
              </DropdownMenuItem>
              {manageHref ? (
                <DropdownMenuItem asChild className="gap-2">
                  <Link to={manageHref}>
                    <Settings className="h-4 w-4 text-muted-foreground" aria-hidden />
                    Manage subscription
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="gap-2"
                  onSelect={() =>
                    toast.message('Manage subscription', {
                      description: 'Subscription controls are available on live plans.',
                    })
                  }
                >
                  <Settings className="h-4 w-4 text-muted-foreground" aria-hidden />
                  Manage subscription
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="gap-2">
                <Link to="/support">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" aria-hidden />
                  Get help
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onSelect={() =>
                  toast.message('Report submitted', {
                    description: `Thanks — we'll review ${displayName}.`,
                  })
                }
              >
                <Flag className="h-4 w-4 text-muted-foreground" aria-hidden />
                Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </li>
  );
}

export function MemberMyCreatorRowSkeleton() {
  return (
    <li className="list-none border-b border-border py-5">
      <div className="flex gap-4">
        <div className="h-16 w-16 shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
            <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      </div>
    </li>
  );
}
