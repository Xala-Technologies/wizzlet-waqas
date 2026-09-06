import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { Lock, Unlock, Users, AlertTriangle, Zap, Loader2, PackageOpen } from 'lucide-react';
import { toast } from 'sonner';

const CreatorAccessControl = () => {
  const { creator, loading: creatorLoading } = useCreatorProfile();
  const products = useQuery(
    api.products.mutations.listByCreator,
    creator ? { creatorId: creator.id as Id<'creators'>, activeOnly: true } : 'skip',
  );
  const subs = useQuery(api.subscriptions.mutations.listForMyCreator);
  const upsertProduct = useMutation(api.products.mutations.upsert);
  const [draftSpots, setDraftSpots] = useState<Record<string, number | null>>({});

  const loading = creatorLoading || products === undefined || subs === undefined;

  const items = useMemo(() => {
    const activeSubs = (subs ?? []).filter((s) => s.status === 'active');
    return (products ?? []).map((p) => ({
      id: p._id,
      name: p.name,
      price: p.priceCents / 100,
      max_spots: draftSpots[p._id] ?? p.maxSpots ?? null,
      is_limited: p.isLimited,
      is_closed: p.isClosed,
      taken: activeSubs.filter((s) => s.amountCents === p.priceCents).length,
      raw: p,
    }));
  }, [products, subs, draftSpots]);

  const patch = async (
    id: Id<'products'>,
    changes: { maxSpots?: number | null; isLimited?: boolean; isClosed?: boolean },
    message: string,
  ) => {
    const product = products?.find((p) => p._id === id);
    if (!product || !creator) return;
    try {
      await upsertProduct({
        productId: id,
        creatorId: creator.id as Id<'creators'>,
        name: product.name,
        description: product.description,
        priceCents: product.priceCents,
        billingPeriod: product.billingPeriod,
        isFeatured: product.isFeatured,
        isActive: product.isActive,
        maxSpots: changes.maxSpots !== undefined ? (changes.maxSpots ?? undefined) : product.maxSpots,
        isLimited: changes.isLimited ?? product.isLimited,
        isClosed: changes.isClosed ?? product.isClosed,
      });
      toast.success(message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  return (
    <DashboardLayout type="creator">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Access Control</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage subscriber limits and exclusivity for your products</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <PackageOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No active products yet — create one under Products first.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(product => {
            const spotsLeft = product.is_limited && product.max_spots !== null
              ? Math.max(product.max_spots - product.taken, 0)
              : null;
            const fillPercent = product.max_spots ? Math.min((product.taken / product.max_spots) * 100, 100) : 0;
            const isUrgent = spotsLeft !== null && spotsLeft <= 10;

            return (
              <div key={product.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{product.name}</h3>
                      {product.is_closed && (
                        <Badge variant="outline" className="text-[9px] bg-destructive/10 text-destructive border-destructive/20">
                          <Lock className="h-2.5 w-2.5 mr-1" /> Closed
                        </Badge>
                      )}
                      {isUrgent && !product.is_closed && (
                        <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/20">
                          <AlertTriangle className="h-2.5 w-2.5 mr-1" /> {spotsLeft} spots left
                        </Badge>
                      )}
                      {!product.is_limited && (
                        <Badge variant="outline" className="text-[9px] bg-muted text-muted-foreground border-border">Unlimited</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {product.taken} subscribers</span>
                      {product.is_limited && product.max_spots && <span>of {product.max_spots} spots</span>}
                      <span>${product.price.toFixed(2)}/mo</span>
                    </div>
                  </div>
                  <Button
                    variant={product.is_closed ? 'hero' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => patch(product.id, { isClosed: !product.is_closed }, product.is_closed ? 'Product reopened' : 'Product closed')}
                  >
                    {product.is_closed ? <><Unlock className="mr-1 h-3 w-3" /> Reopen</> : <><Lock className="mr-1 h-3 w-3" /> Close</>}
                  </Button>
                </div>

                {product.is_limited && product.max_spots && (
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                      <span>{product.taken} / {product.max_spots} filled</span>
                      <span>{Math.round(fillPercent)}%</span>
                    </div>
                    <Progress value={fillPercent} className="h-2" />
                    {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 10 && (
                      <p className="text-[11px] text-amber-500 mt-2 flex items-center gap-1">
                        <Zap className="h-3 w-3" /> Only {spotsLeft} spots remaining — high demand
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      aria-label={`Limit spots for ${product.name}`}
                      checked={product.is_limited}
                      onCheckedChange={() => patch(
                        product.id,
                        { isLimited: !product.is_limited, maxSpots: !product.is_limited ? (product.max_spots ?? 100) : product.max_spots },
                        'Access limit updated',
                      )}
                    />
                    <span className="text-xs text-muted-foreground">Limit subscriber count</span>
                  </div>
                  {product.is_limited && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Max spots</span>
                      <Input
                        type="number"
                        min="1"
                        className="h-8 w-24"
                        value={product.max_spots ?? ''}
                        onChange={e => setDraftSpots(prev => ({
                          ...prev,
                          [product.id]: e.target.value ? Number(e.target.value) : null,
                        }))}
                        onBlur={() => patch(product.id, { maxSpots: product.max_spots }, 'Spot limit saved')}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CreatorAccessControl;
