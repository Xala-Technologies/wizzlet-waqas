import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { Tag, Plus, Trash2, Loader2, Percent } from 'lucide-react';
import { toast } from 'sonner';

const CreatorPromo = () => {
  const { creator, loading: creatorLoading } = useCreatorProfile();
  const promos = useQuery(api.creators.growth.listMyPromos);
  const upsertPromo = useMutation(api.creators.growth.upsertPromo);
  const removePromo = useMutation(api.creators.growth.removePromo);

  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('15');
  const [maxUses, setMaxUses] = useState('');
  const [saving, setSaving] = useState(false);

  const loading = creatorLoading || promos === undefined;

  const handleCreate = async () => {
    if (!creator) return;
    const clean = code.trim().toUpperCase();
    if (clean.length < 3) {
      toast.error('Codes need at least 3 characters');
      return;
    }
    const d = Number(discount);
    if (Number.isNaN(d) || d < 1 || d > 90) {
      toast.error('Discount must be between 1% and 90%');
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
        maxUses: max,
        isActive: true,
      });
      toast.success(`${clean} created`);
      setCode('');
      setMaxUses('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create code';
      if (msg.includes('PROMO_CODE_TAKEN')) toast.error('That code is already taken');
      else if (msg.includes('INVALID_')) toast.error('Invalid promo details');
      else toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (promoId: Id<'promoCodes'>, next: boolean, existing: {
    code: string;
    discountPercent: number;
    maxUses?: number;
    expiresAt?: number;
  }) => {
    try {
      await upsertPromo({
        promoId,
        code: existing.code,
        discountPercent: existing.discountPercent,
        maxUses: existing.maxUses,
        expiresAt: existing.expiresAt,
        isActive: next,
      });
      toast.success(next ? `${existing.code} enabled` : `${existing.code} disabled`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const handleDelete = async (promoId: Id<'promoCodes'>) => {
    try {
      await removePromo({ promoId });
      toast.success('Code removed');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const rows = promos ?? [];

  return (
    <DashboardLayout type="creator">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Promo Codes</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Codes apply a one-time percent off the first Stripe Checkout invoice.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-5 mb-6">
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <Tag className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No promo codes yet — create one on the right.</p>
            </div>
          ) : (
            rows.map((p) => (
              <div
                key={p._id}
                className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-medium text-sm">{p.code}</p>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {p.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {p.discountPercent}% off · used {p.usedCount}
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
                        maxUses: p.maxUses,
                        expiresAt: p.expiresAt,
                      })
                    }
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => void handleDelete(p._id)}
                    aria-label={`Delete ${p.code}`}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 h-fit space-y-3">
          <p className="text-sm font-medium flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> New code
          </p>
          <div>
            <Label className="text-xs">Code</Label>
            <Input
              className="mt-1 font-mono uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="WELCOME20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Discount %</Label>
              <Input
                className="mt-1"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Max uses</Label>
              <Input
                className="mt-1"
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="∞"
              />
            </div>
          </div>
          <Button
            className="w-full"
            variant="hero"
            onClick={() => void handleCreate()}
            disabled={saving || !creator}
          >
            {saving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Percent className="mr-1.5 h-3.5 w-3.5" />
            )}
            Create code
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreatorPromo;
