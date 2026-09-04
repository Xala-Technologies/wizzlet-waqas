import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { Plus, Copy, Tag, Percent, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
  max_uses: number | null;
  times_used: number;
  expires_at: string | null;
  is_active: boolean;
}

const CreatorPromo = () => {
  const { creator, loading: creatorLoading } = useCreatorProfile();
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('20');
  const [maxUses, setMaxUses] = useState('');
  const [expires, setExpires] = useState('');

  useEffect(() => {
    if (creatorLoading) return;
    if (!creator) { setLoading(false); return; }
    const load = async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('id, code, discount_percent, max_uses, times_used, expires_at, is_active')
        .eq('creator_id', creator.id)
        .order('created_at', { ascending: false });
      if (error) toast.error(error.message);
      setPromos(data ?? []);
      setLoading(false);
    };
    void load();
  }, [creator, creatorLoading]);

  const handleCreate = async () => {
    if (!creator) return;
    const pct = Number(discount);
    if (!code.trim() || !pct || pct < 1 || pct > 100) {
      toast.error('Enter a code and a discount between 1 and 100%');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from('promo_codes')
      .insert({
        creator_id: creator.id,
        code: code.trim().toUpperCase(),
        discount_percent: Math.round(pct),
        max_uses: maxUses ? Number(maxUses) : null,
        expires_at: expires ? new Date(expires).toISOString() : null,
      })
      .select('id, code, discount_percent, max_uses, times_used, expires_at, is_active')
      .maybeSingle();
    setSaving(false);
    if (error) {
      toast.error(error.code === '23505' ? 'That code is already taken' : error.message);
      return;
    }
    if (data) setPromos(prev => [data, ...prev]);
    setCode(''); setMaxUses(''); setExpires('');
    toast.success('Promo code created');
  };

  const toggleActive = async (promo: PromoCode) => {
    setPromos(prev => prev.map(p => p.id === promo.id ? { ...p, is_active: !p.is_active } : p));
    const { error } = await supabase.from('promo_codes').update({ is_active: !promo.is_active }).eq('id', promo.id);
    if (error) {
      setPromos(prev => prev.map(p => p.id === promo.id ? { ...p, is_active: promo.is_active } : p));
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    const previous = promos;
    setPromos(prev => prev.filter(p => p.id !== id));
    const { error } = await supabase.from('promo_codes').delete().eq('id', id);
    if (error) { setPromos(previous); toast.error(error.message); return; }
    toast.success('Promo code deleted');
  };

  const isExpired = (p: PromoCode) =>
    (p.expires_at && new Date(p.expires_at) < new Date()) || (p.max_uses !== null && p.times_used >= p.max_uses);

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
      ) : promos.length === 0 ? (
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
          {promos.map(promo => (
            <div key={promo.id} className="grid grid-cols-1 sm:grid-cols-6 gap-2 sm:gap-3 px-5 py-4 border-b border-border last:border-0 items-center">
              <span className="font-mono font-semibold text-sm flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-primary shrink-0" /> {promo.code}
              </span>
              <span className="text-sm flex items-center gap-1">
                <Percent className="h-3 w-3 text-muted-foreground" />{promo.discount_percent}% off
              </span>
              <span className="text-sm text-muted-foreground">
                {promo.expires_at ? format(new Date(promo.expires_at), 'MMM d, yyyy') : 'Never'}
              </span>
              <span className="text-sm text-muted-foreground">
                {promo.times_used}{promo.max_uses ? `/${promo.max_uses}` : ''}
              </span>
              <span className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${promo.is_active && !isExpired(promo)
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-muted text-muted-foreground border-border'}`}
                >
                  {isExpired(promo) ? 'expired' : promo.is_active ? 'active' : 'paused'}
                </Badge>
                <Switch aria-label={`Promo code ${promo.code} active`} checked={promo.is_active} onCheckedChange={() => toggleActive(promo)} />
              </span>
              <span className="text-right">
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => { navigator.clipboard.writeText(promo.code); toast.success('Copied!'); }}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleDelete(promo.id)}>
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
