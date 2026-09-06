import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { Plus, Copy, Tag, Percent, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const CreatorPromo = () => {
  const { creator, loading: creatorLoading } = useCreatorProfile();
  const promos = useQuery(api.creators.growth.listMyPromos);
  const upsertPromo = useMutation(api.creators.growth.upsertPromo);
  const removePromo = useMutation(api.creators.growth.removePromo);

  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('20');
  const [maxUses, setMaxUses] = useState('');
  const [expires, setExpires] = useState('');

  const loading = creatorLoading || promos === undefined;

  const handleCreate = async () => {
    if (!creator) return;
    const pct = Number(discount);
    if (!code.trim() || !pct || pct < 1 || pct > 100) {
      toast.error('Enter a code and a discount between 1 and 100%');
      return;
    }
    setSaving(true);
    try {
      await upsertPromo({
        code: code.trim().toUpperCase(),
        discountPercent: Math.round(pct),
        maxUses: maxUses ? Number(maxUses) : undefined,
        expiresAt: expires ? new Date(expires).getTime() : undefined,
        isActive: true,
      });
      setCode('');
      setMaxUses('');
      setExpires('');
      toast.success('Promo code created');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create promo';
      toast.error(msg.includes('unique') || msg.includes('already') ? 'That code is already taken' : msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (promo: NonNullable<typeof promos>[number]) => {
    try {
      await upsertPromo({
        promoId: promo._id,
        code: promo.code,
        discountPercent: promo.discountPercent,
        maxUses: promo.maxUses,
        expiresAt: promo.expiresAt,
        isActive: !promo.isActive,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update promo');
    }
  };

  const handleDelete = async (id: Id<'promoCodes'>) => {
    try {
      await removePromo({ promoId: id });
      toast.success('Promo code deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete promo');
    }
  };

  const isExpired = (p: NonNullable<typeof promos>[number]) =>
    (p.expiresAt != null && p.expiresAt < Date.now()) ||
    (p.maxUses != null && p.usedCount >= p.maxUses);

  return (
    <DashboardLayout type="creator">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Promo Codes</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Create and manage promotional codes for your subscribers</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-8">
        <h2 className="text-sm font-semibold mb-5 flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" /> Create Promo Code
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Code</Label>
            <Input placeholder="SUMMER25" value={code} onChange={e => setCode(e.target.value.toUpperCase())} className="mt-1.5 font-mono" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Discount (%)</Label>
            <Input type="number" min="1" max="100" value={discount} onChange={e => setDiscount(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Usage Limit (optional)</Label>
            <Input type="number" min="1" placeholder="Unlimited" value={maxUses} onChange={e => setMaxUses(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Expires (optional)</Label>
            <Input type="date" value={expires} onChange={e => setExpires(e.target.value)} className="mt-1.5" />
          </div>
        </div>
        <div className="mt-5">
          <Button variant="hero" size="sm" onClick={handleCreate} disabled={saving || !creator}>
            {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Create Code
          </Button>
        </div>
      </div>

      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Existing Codes</h2>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (promos ?? []).length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Tag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No promo codes yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="hidden sm:grid grid-cols-6 gap-3 px-5 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/30">
            <span>Code</span>
            <span>Discount</span>
            <span>Expires</span>
            <span>Usage</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          {(promos ?? []).map(promo => (
            <div key={promo._id} className="grid grid-cols-1 sm:grid-cols-6 gap-2 sm:gap-3 px-5 py-4 border-b border-border last:border-0 items-center">
              <span className="font-mono font-semibold text-sm flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-primary shrink-0" /> {promo.code}
              </span>
              <span className="text-sm flex items-center gap-1">
                <Percent className="h-3 w-3 text-muted-foreground" />{promo.discountPercent}% off
              </span>
              <span className="text-sm text-muted-foreground">
                {promo.expiresAt ? format(new Date(promo.expiresAt), 'MMM d, yyyy') : 'Never'}
              </span>
              <span className="text-sm text-muted-foreground">
                {promo.usedCount}{promo.maxUses ? `/${promo.maxUses}` : ''}
              </span>
              <span className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${promo.isActive && !isExpired(promo)
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-muted text-muted-foreground border-border'}`}
                >
                  {isExpired(promo) ? 'expired' : promo.isActive ? 'active' : 'paused'}
                </Badge>
                <Switch aria-label={`Promo code ${promo.code} active`} checked={promo.isActive} onCheckedChange={() => toggleActive(promo)} />
              </span>
              <span className="text-right">
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => { navigator.clipboard.writeText(promo.code); toast.success('Copied!'); }}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleDelete(promo._id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </span>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CreatorPromo;
