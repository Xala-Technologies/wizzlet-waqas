import { format, formatDistanceToNowStrict } from 'date-fns';
import {
  Calendar,
  CheckCircle2,
  Copy,
  DollarSign,
  Mail,
  MessageSquare,
  RefreshCw,
  UserMinus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { copyToClipboard } from '@/lib/clipboard';
import { initialsFromName } from '@/lib/creatorSubscribersDemo';
import { kpiIconTone, resultPillTone } from '@/lib/kpiIconTones';
import { cn } from '@/lib/utils';

export type SubscriberDetail = {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  plan: 'Premium' | 'Monthly' | 'VIP' | '—';
  status: 'active' | 'cancelled' | 'trial';
  joinedAtMs: number;
  renewalAtMs: number | null;
  totalSpentCents: number;
  avatarUrl: string | null;
};

function planTone(plan: SubscriberDetail['plan']): string {
  if (plan === 'VIP') return resultPillTone.vip;
  if (plan === 'Premium') return resultPillTone.premium;
  if (plan === 'Monthly') return resultPillTone.monthly;
  return 'bg-muted text-muted-foreground border-border';
}

function statusTone(status: SubscriberDetail['status']): string {
  if (status === 'active') return resultPillTone.active;
  if (status === 'cancelled') return resultPillTone.cancelled;
  return resultPillTone.trial;
}

function avatarTone(plan: SubscriberDetail['plan']): string {
  if (plan === 'VIP') return kpiIconTone.rose;
  if (plan === 'Premium') return kpiIconTone.sky;
  if (plan === 'Monthly') return kpiIconTone.violet;
  return kpiIconTone.amber;
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/80 px-3 py-3 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', tone)}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 truncate text-base font-extrabold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

export function SubscriberDetailDialog({
  row,
  open,
  onOpenChange,
  onMessage,
}: {
  row: SubscriberDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMessage: () => void;
}) {
  const active = open && row != null;

  const copyEmail = async () => {
    if (!row?.email || row.email === '—') {
      toast.message('No email on file');
      return;
    }
    const ok = await copyToClipboard(row.email);
    if (ok) toast.success('Email copied');
    else toast.error('Could not copy email');
  };

  const tenure = row
    ? formatDistanceToNowStrict(row.joinedAtMs, { addSuffix: false })
    : '';
  const renewalLabel =
    row?.renewalAtMs != null
      ? formatDistanceToNowStrict(row.renewalAtMs, { addSuffix: true })
      : 'No upcoming renewal';
  const statusLabel =
    row?.status === 'cancelled' ? 'Canceled' : (row?.status ?? '');

  return (
    <Dialog open={active} onOpenChange={onOpenChange}>
      {row ? (
        <DialogContent
          overlayClassName="bg-black/45 backdrop-blur-[3px]"
          className="gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 shadow-[var(--shadow-card)] sm:max-w-lg sm:rounded-2xl"
        >
          <div className="relative border-b border-border bg-gradient-to-br from-primary/12 via-card to-card px-5 pb-5 pt-5 sm:px-6 sm:pt-6">
            <DialogHeader className="space-y-0 pr-8 text-left">
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                  {row.avatarUrl ? <AvatarImage src={row.avatarUrl} alt="" /> : null}
                  <AvatarFallback className={cn('text-sm font-bold', avatarTone(row.plan))}>
                    {initialsFromName(row.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Subscriber profile
                  </p>
                  <DialogTitle className="mt-1 truncate text-heading font-bold tracking-tight">
                    {row.name}
                  </DialogTitle>
                  <DialogDescription className="mt-1.5 flex items-center gap-1.5 truncate text-support text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {row.email}
                  </DialogDescription>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold',
                        planTone(row.plan),
                      )}
                    >
                      {row.plan}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize',
                        statusTone(row.status),
                      )}
                    >
                      {row.status === 'active' ? (
                        <CheckCircle2 className="h-3 w-3" aria-hidden />
                      ) : null}
                      {row.status === 'cancelled' ? (
                        <UserMinus className="h-3 w-3" aria-hidden />
                      ) : null}
                      {statusLabel}
                    </span>
                  </div>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-muted/15 px-5 py-4 sm:gap-3 sm:px-6">
            <StatTile
              icon={DollarSign}
              label="Spent"
              value={`$${(row.totalSpentCents / 100).toFixed(2)}`}
              tone={kpiIconTone.emerald}
            />
            <StatTile
              icon={Calendar}
              label="Member"
              value={tenure}
              tone={kpiIconTone.violet}
            />
            <StatTile
              icon={RefreshCw}
              label="Renewal"
              value={row.renewalAtMs ? format(row.renewalAtMs, 'MMM d') : '—'}
              tone={kpiIconTone.sky}
            />
          </div>

          <div className="space-y-3 border-t border-border px-5 py-4 sm:px-6">
            <p className="text-sm font-extrabold text-foreground">Activity</p>
            <ol className="relative space-y-4 before:absolute before:bottom-1 before:left-[3px] before:top-1 before:w-px before:bg-border">
              <li className="relative flex gap-3 pl-0.5">
                <span
                  className="relative z-[1] mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary ring-4 ring-card"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Joined</p>
                  <p className="text-xs text-muted-foreground">
                    {format(row.joinedAtMs, 'EEEE, MMM d, yyyy')} · {tenure} ago
                  </p>
                </div>
              </li>
              {row.status === 'trial' ? (
                <li className="relative flex gap-3 pl-0.5">
                  <span
                    className="relative z-[1] mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500 ring-4 ring-card"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">On trial</p>
                    <p className="text-xs text-muted-foreground">{renewalLabel}</p>
                  </div>
                </li>
              ) : null}
              {row.status === 'active' && row.renewalAtMs ? (
                <li className="relative flex gap-3 pl-0.5">
                  <span
                    className="relative z-[1] mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500 ring-4 ring-card"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Next renewal</p>
                    <p className="text-xs text-muted-foreground">
                      {format(row.renewalAtMs, 'EEEE, MMM d, yyyy')} · {renewalLabel}
                    </p>
                  </div>
                </li>
              ) : null}
              {row.status === 'cancelled' ? (
                <li className="relative flex gap-3 pl-0.5">
                  <span
                    className="relative z-[1] mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500 ring-4 ring-card"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Subscription canceled</p>
                    <p className="text-xs text-muted-foreground">
                      Access may end at period close.
                    </p>
                  </div>
                </li>
              ) : null}
            </ol>
          </div>

          <div className="flex flex-col gap-2 border-t border-border bg-muted/25 px-5 py-4 sm:flex-row sm:px-6">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 flex-1 rounded-xl"
              onClick={() => void copyEmail()}
            >
              <Copy className="mr-1.5 h-4 w-4" /> Copy email
            </Button>
            <Button
              type="button"
              className="min-h-11 flex-1 rounded-xl"
              onClick={() => onMessage()}
            >
              <MessageSquare className="mr-1.5 h-4 w-4" /> Message
            </Button>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
