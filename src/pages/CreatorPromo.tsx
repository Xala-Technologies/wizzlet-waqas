import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { resolveDiscountDuration, type PromoDiscountDuration } from '../../convex/lib/promoCodes';
import { Tag, Plus, Trash2, Loader2, Percent } from 'lucide-react';
import { toast } from 'sonner';

const CreatorPromo = () => {
  const { creator, loading: creatorLoading } = useCreatorProfile();
  const promos = useQuery(api.creators.growth.listMyPromos);
  const upsertPromo = useMutation(api.creators.growth.upsertPromo);
  const removePromo = useMutation(api.creators.growth.removePromo);

  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('15');
  const [duration, setDuration] = useState<PromoDiscountDuration>('once');
  const [maxUses, setMaxUses] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<Id<'promoCodes'> | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loading = creatorLoading || promos === undefined;
  const rows = promos ?? [];
  const deleteTarget = rows.find((p) => p._id === deleteId);

  const reviewCode = code.trim().toUpperCase() || 'CODE';
  const reviewDiscount = Number(discount);
  const reviewBits = [
    Number.isInteger(reviewDiscount) && reviewDiscount >= 1 && reviewDiscount <= 100
      ? `${reviewDiscount}%`
      : null,
    duration === 'forever' ? 'Forever' : 'Once',
    maxUses.trim() ? `max ${maxUses.trim()}` : 'unlimited',
  ].filter(Boolean);

  const handleCreate = async () => {
    if (!creator || saving) return;
    const clean = code.trim().toUpperCase();
    if (clean.length < 3) {
      toast.error('Codes need at least 3 characters');
      return;
    }
    const d = Number(discount);
    if (!Number.isInteger(d) || d < 1 || d > 100) {
      toast.error('Discount must be a whole number between 1% and 100%');
      return;
    }
    const max = maxUses.trim() ? Number(maxUses) : undefined;
    if (max !== undefined && (Number.isNaN(max) || max < 1)) {
      toast.error('Max uses must be a positive number');
      return;
    }
    setSaving(true);
    try {
      await upsertPromo({
        code: clean,
        discountPercent: d,
        discountDuration: duration,
        maxUses: max,
        isActive: true,
      });
      toast.success(`${clean} created`);
      setCode('');
      setMaxUses('');
      setDuration('once');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create code';
      if (msg.includes('PROMO_CODE_TAKEN')) toast.error('That code is already taken');
      else if (msg.includes('INVALID_')) toast.error('Invalid promo details');
      else toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (
    promoId: Id<'promoCodes'>,
    next: boolean,
    existing: {
      code: string;
      discountPercent: number;
      discountDuration: PromoDiscountDuration;
      maxUses?: number;
      expiresAt?: number;
    },
  ) => {
    try {
      await upsertPromo({
        promoId,
        code: existing.code,
        discountPercent: existing.discountPercent,
        discountDuration: existing.discountDuration,
        maxUses: existing.maxUses,
        expiresAt: existing.expiresAt,
        isActive: next,
      });
      toast.success(next ? `${existing.code} enabled` : `${existing.code} disabled`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await removePromo({ promoId: deleteId });
      toast.success('Code removed');
      setDeleteId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout type="creator">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!creator) {
    return (
      <DashboardLayout type="creator">
        <header className="mb-6">
          <h1 className="text-heading font-bold text-foreground">Promo Codes</h1>
          <p className="text-support text-muted-foreground mt-0.5">
            Percent off for the first month only, or forever on every renewal.
          </p>
        </header>
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Tag className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-ui font-semibold text-foreground mb-2">No creator profile yet</h3>
          <p className="text-support text-muted-foreground max-w-xs mx-auto mb-5">
            Finish onboarding to create promo codes for subscribers.
          </p>
          <Button asChild className="min-h-11">
            <Link to="/creator/onboarding">Set up your profile</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const createForm = (
    <div className="rounded-xl border border-border bg-card p-5 h-fit space-y-4 order-1 lg:order-2">
      <p className="text-ui font-semibold text-foreground flex items-center gap-2">
        <Plus className="h-4 w-4 text-primary" /> New code
      </p>
      <div className="space-y-2">
        <Label htmlFor="promo-code" className="text-support text-muted-foreground">
          Code
        </Label>
        <Input
          id="promo-code"
          className="h-11 min-h-11 font-mono uppercase text-ui"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="SUMMER_SALE"
          maxLength={32}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="promo-discount" className="text-support text-muted-foreground">
          Discount % (1–100)
        </Label>
        <Input
          id="promo-discount"
          className="h-11 min-h-11 text-ui"
          type="number"
          min={1}
          max={100}
          step={1}
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
        />
      </div>
      <fieldset className="space-y-2">
        <Legend className="text-support font-medium text-muted-foreground">Discount duration</Legend>
        <label className="flex items-start gap-2.5 cursor-pointer rounded-xl border border-border p-3 min-h-11 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
          <input
            type="radio"
            name="promo-duration"
            className="mt-1"
            checked={duration === 'once'}
            onChange={() => setDuration('once')}
          />
          <span>
            <span className="text-ui font-medium block text-foreground">Once</span>
            <span className="text-support text-muted-foreground">Applies to the first month only</span>
          </span>
        </label>
        <label className="flex items-start gap-2.5 cursor-pointer rounded-xl border border-border p-3 min-h-11 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
          <input
            type="radio"
            name="promo-duration"
            className="mt-1"
            checked={duration === 'forever'}
            onChange={() => setDuration('forever')}
          />
          <span>
            <span className="text-ui font-medium block text-foreground">Forever</span>
            <span className="text-support text-muted-foreground">Applies to every renewal</span>
          </span>
        </label>
      </fieldset>
      <div className="space-y-2">
        <Label htmlFor="promo-max" className="text-support text-muted-foreground">
          Max redemptions (optional)
        </Label>
        <Input
          id="promo-max"
          className="h-11 min-h-11 text-ui"
          type="number"
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          placeholder="Unlimited"
          min={1}
        />
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-caption text-muted-foreground uppercase tracking-wider mb-1">
          Ready to create
        </p>
        <p className="text-ui text-foreground truncate font-mono">{reviewCode}</p>
        <p className="text-support text-muted-foreground mt-0.5 truncate">
          {reviewBits.join(' · ')}
        </p>
        <p className="text-caption text-muted-foreground mt-2">
          Disabling or deleting a code does not change past purchases.
        </p>
      </div>

      <Button
        type="button"
        className="w-full min-h-11"
        onClick={() => void handleCreate()}
        disabled={saving || !code.trim()}
      >
        {saving ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Percent className="mr-1.5 h-3.5 w-3.5" />
        )}
        Create code
      </Button>
    </div>
  );

  const listColumn = (
    <div className="space-y-3 order-2 lg:order-1">
      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Tag className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-ui font-semibold text-foreground mb-2">No promo codes yet</h3>
          <p className="text-support text-muted-foreground max-w-xs mx-auto">
            <span className="lg:hidden">Create one above to offer a percent discount.</span>
            <span className="hidden lg:inline">Create one on the right to offer a percent discount.</span>
          </p>
        </div>
      ) : (
        rows.map((p) => {
          const dur = resolveDiscountDuration(p);
          return (
            <div
              key={p._id}
              className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-mono font-medium text-ui text-foreground">{p.code}</p>
                  <span className="text-support text-muted-foreground">
                    {p.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <p className="text-support text-muted-foreground mt-1">
                  {p.discountPercent}% off · {dur === 'forever' ? 'forever' : 'first month'} · used{' '}
                  {p.usedCount}
                  {p.maxUses != null ? `/${p.maxUses}` : ''} times
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  aria-label={`Promo code ${p.code} active`}
                  checked={p.isActive}
                  onCheckedChange={(v) =>
                    void handleToggle(p._id, v, {
                      code: p.code,
                      discountPercent: p.discountPercent,
                      discountDuration: dur,
                      maxUses: p.maxUses,
                      expiresAt: p.expiresAt,
                    })
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 px-3 text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(p._id)}
                  aria-label={`Delete ${p.code}`}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <DashboardLayout type="creator">
      <header className="mb-6">
        <h1 className="text-heading font-bold text-foreground">Promo Codes</h1>
        <p className="text-support text-muted-foreground mt-0.5">
          Percent off for the first month only, or forever on every renewal.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5 mb-6">
        {listColumn}
        {createForm}
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this promo code?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `“${deleteTarget.code}” will be removed from your catalogue. Existing purchases keep their original discount terms.`
                : 'This code will be removed from your catalogue. Existing purchases keep their original discount terms.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

function Legend({ className, children }: { className?: string; children: ReactNode }) {
  return <legend className={className}>{children}</legend>;
}

export default CreatorPromo;
