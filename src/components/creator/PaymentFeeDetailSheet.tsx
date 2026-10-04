import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  isRefundablePayment,
  moneyExact,
  paymentStatusLabel,
  type PaymentFeeDetail,
} from '@/lib/paymentFeeDetail';
import { cn } from '@/lib/utils';

function statusClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'succeeded' || s === 'settled' || s === 'paid') {
    return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
  }
  if (s === 'refunded') {
    return 'border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-400';
  }
  if (s === 'chargeback' || s === 'failed') {
    return 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400';
  }
  return 'border-border bg-muted text-muted-foreground';
}

export function PaymentFeeStack({
  amountCents,
  platformFeeCents,
  creatorEarningsCents,
  feePercentage,
  compact,
}: {
  amountCents: number;
  platformFeeCents: number;
  creatorEarningsCents: number;
  feePercentage: number;
  compact?: boolean;
}) {
  return (
    <dl className={cn('space-y-3', compact && 'space-y-2')}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <dt className="text-muted-foreground">Amount paid</dt>
        <dd className="tabular-nums font-semibold text-foreground">{moneyExact(amountCents)}</dd>
      </div>
      <div>
        <p className="text-sm font-extrabold text-foreground">Prizelet fee</p>
        <div className="mt-2 flex items-baseline justify-between gap-3 text-sm">
          <dt className="text-muted-foreground">
            Platform fee ({feePercentage % 1 === 0 ? feePercentage.toFixed(0) : feePercentage}%)
          </dt>
          <dd className="tabular-nums text-foreground">{moneyExact(platformFeeCents)}</dd>
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3 text-sm">
        <dt className="font-semibold text-foreground">You receive</dt>
        <dd className="tabular-nums font-extrabold text-foreground">
          {moneyExact(creatorEarningsCents)}
        </dd>
      </div>
    </dl>
  );
}

export function PaymentFeeDetailSheet({
  open,
  onOpenChange,
  payment,
  onRefund,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentFeeDetail | null;
  onRefund?: (payment: PaymentFeeDetail) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-y-auto sm:max-w-2xl"
      >
        {payment ? (
          <>
            <SheetHeader className="pr-8 text-left">
              <SheetTitle>Payment {moneyExact(payment.amountCents)}</SheetTitle>
              <SheetDescription>
                Customer paid. Prizelet takes a percent. You keep the rest.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              <dl className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Customer</dt>
                  <dd className="text-right font-semibold text-foreground">
                    <p>{payment.customerName}</p>
                    {payment.customerEmail ? (
                      <p className="text-xs font-normal text-muted-foreground">
                        {payment.customerEmail}
                      </p>
                    ) : null}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <span
                      className={cn(
                        'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold',
                        statusClass(payment.status),
                      )}
                    >
                      {paymentStatusLabel(payment.status)}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Date</dt>
                  <dd className="text-right text-foreground">
                    {format(payment.dateMs, 'MMM d, yyyy')} at {format(payment.dateMs, 'h:mm a')}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Payment ID</dt>
                  <dd className="max-w-[12rem] truncate text-right font-mono text-xs text-foreground">
                    {payment.paymentRef ?? payment.id}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Product</dt>
                  <dd className="text-right font-semibold text-foreground">{payment.productName}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="text-right text-foreground">{payment.typeLabel}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                  <dt className="text-muted-foreground">Amount paid</dt>
                  <dd className="tabular-nums font-semibold">{moneyExact(payment.amountCents)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Fees</dt>
                  <dd className="tabular-nums">{moneyExact(payment.platformFeeCents)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-semibold text-foreground">You receive</dt>
                  <dd className="tabular-nums font-extrabold">
                    {moneyExact(payment.creatorEarningsCents)}
                  </dd>
                </div>
              </dl>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                <PaymentFeeStack
                  amountCents={payment.amountCents}
                  platformFeeCents={payment.platformFeeCents}
                  creatorEarningsCents={payment.creatorEarningsCents}
                  feePercentage={payment.feePercentage}
                />
              </div>
            </div>
            {onRefund &&
            isRefundablePayment(payment.status, payment.amountCents, payment.typeLabel) ? (
              <div className="mt-8 flex justify-end border-t border-border pt-5">
                <Button
                  type="button"
                  variant="destructive"
                  className="min-h-11 rounded-xl"
                  onClick={() => onRefund(payment)}
                >
                  Refund
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
