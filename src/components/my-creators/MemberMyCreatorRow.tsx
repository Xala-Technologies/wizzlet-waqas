import { Link } from 'react-router-dom';
import { BadgeCheck, MoreHorizontal } from 'lucide-react';
import { creatorProfilePath } from '@/lib/creatorProfilePath';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  sports: string[];
  winRate: number | null;
  profit30dUnits: number | null;
  followersLabel: string | null;
  monthlyPriceCents: number;
  statusLabel: string;
  statusTone?: 'ok' | 'warn' | 'danger' | 'muted';
  renewsLabel: string;
  verified?: boolean;
  onManage?: () => void;
  onMessage?: () => void;
  onCancel?: () => void;
  onOpenBilling?: () => void;
  cancelDisabled?: boolean;
  className?: string;
};

function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toFixed(cents % 100 === 0 ? 0 : 2)}/month`;
}

export function MemberMyCreatorRow({
  username,
  displayName,
  bio,
  avatarUrl,
  avatarInitials,
  avatarTone = 'bg-slate-900',
  sports,
  winRate,
  profit30dUnits,
  followersLabel,
  monthlyPriceCents,
  statusLabel,
  statusTone = 'ok',
  renewsLabel,
  verified = true,
  onManage,
  onMessage,
  onCancel,
  onOpenBilling,
  cancelDisabled,
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
  const profitPositive = (profit30dUnits ?? 0) >= 0;
  const profitLabel =
    profit30dUnits == null
      ? '—'
      : `${profitPositive ? '+' : ''}${profit30dUnits.toFixed(1)}u`;
  const statusClass =
    statusTone === 'ok'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : statusTone === 'warn'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : statusTone === 'danger'
          ? 'bg-rose-50 text-rose-700 border-rose-200'
          : 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <li
      className={cn(
        'list-none rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5',
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <Link
            to={creatorProfilePath(username)}
            className={cn(
              'flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-base font-bold text-white shadow-sm',
              !avatarUrl && avatarTone,
            )}
            aria-label={`${displayName} profile`}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                to={creatorProfilePath(username)}
                className="truncate text-[15px] font-bold text-slate-900 hover:underline"
              >
                {displayName}
              </Link>
              {verified ? (
                <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified" />
              ) : null}
            </div>
            <p className="mt-1 line-clamp-1 text-sm text-slate-500">{bio}</p>
            {sports.length > 0 ? (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {sports.slice(0, 4).map((sport) => (
                  <span
                    key={sport}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                  >
                    {sport}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-3 grid max-w-md grid-cols-3 gap-3 border-t border-slate-100 pt-3 sm:max-w-sm">
              <div>
                <p className="text-sm font-extrabold tabular-nums text-slate-900">
                  {winRate == null ? '—' : `${winRate}%`}
                </p>
                <p className="text-[11px] font-medium text-slate-400">Win Rate</p>
              </div>
              <div>
                <p
                  className={cn(
                    'text-sm font-extrabold tabular-nums',
                    profit30dUnits == null
                      ? 'text-slate-900'
                      : profitPositive
                        ? 'text-emerald-600'
                        : 'text-rose-600',
                  )}
                >
                  {profitLabel}
                </p>
                <p className="text-[11px] font-medium text-slate-400">Profit (30d)</p>
              </div>
              <div>
                <p className="text-sm font-extrabold tabular-nums text-slate-900">
                  {followersLabel ?? '—'}
                </p>
                <p className="text-[11px] font-medium text-slate-400">Followers</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between lg:w-[280px] lg:flex-col lg:items-end lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
          <div className="text-left lg:text-right">
            <span
              className={cn(
                'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                statusClass,
              )}
            >
              {statusLabel}
            </span>
            <p className="mt-2 text-sm font-bold text-slate-900">
              {formatPrice(monthlyPriceCents)}
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-400">{renewsLabel}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-9 rounded-xl bg-primary/10 px-4 font-semibold text-primary hover:bg-primary/15"
              onClick={onManage}
            >
              Manage
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl border-slate-200"
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={creatorProfilePath(username)}>View profile</Link>
                </DropdownMenuItem>
                {onMessage ? (
                  <DropdownMenuItem onSelect={() => onMessage()}>Message</DropdownMenuItem>
                ) : null}
                {onOpenBilling ? (
                  <DropdownMenuItem onSelect={() => onOpenBilling()}>
                    Open billing portal
                  </DropdownMenuItem>
                ) : null}
                {onCancel ? (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    disabled={cancelDisabled}
                    onSelect={() => onCancel()}
                  >
                    Cancel subscription
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </li>
  );
}

export function MemberMyCreatorRowSkeleton() {
  return (
    <li className="list-none rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex gap-4">
        <div className="h-16 w-16 shrink-0 animate-pulse rounded-full bg-slate-200" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="h-8 w-full max-w-sm animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    </li>
  );
}
