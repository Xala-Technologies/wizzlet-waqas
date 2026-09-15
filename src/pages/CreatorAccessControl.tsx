import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { Lock, Unlock, Users, AlertTriangle, Loader2, PackageOpen } from 'lucide-react';
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
  const [savingId, setSavingId] = useState<Id<'products'> | null>(null);

  const loading =
    creatorLoading ||
    (creator !== null && (products === undefined || subs === undefined));

  const items = useMemo(() => {
    const activeSubs = (subs ?? []).filter((s) => s.status === 'active');
    return (products ?? []).map((p) => ({
      id: p._id,
      name: p.name,
      price: p.priceCents / 100,
      max_spots: draftSpots[p._id] !== undefined ? draftSpots[p._id] : (p.maxSpots ?? null),
      is_limited: p.isLimited,
      is_closed: p.isClosed,
      taken: activeSubs.filter((s) => s.productId === p._id).length,
    }));
  }, [products, subs, draftSpots]);

  const patch = async (
    id: Id<'products'>,
    changes: { maxSpots?: number | null; isLimited?: boolean; isClosed?: boolean },
    message: string,
  ) => {
    const product = products?.find((p) => p._id === id);
    if (!product || !creator || savingId) return;
    setSavingId(id);
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
      if (changes.maxSpots !== undefined) {
        setDraftSpots((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
      toast.success(message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSavingId(null);
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
          <h1 className="text-heading font-bold text-foreground">Access Control</h1>
          <p className="text-support text-muted-foreground mt-0.5">
            Manage subscriber limits and exclusivity for your products.
          </p>
        </header>
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-ui font-semibold text-foreground mb-2">No creator profile yet</h3>
          <p className="text-support text-muted-foreground max-w-xs mx-auto mb-5">
            Finish onboarding to manage product access.
          </p>
          <Button asChild className="min-h-11">
            <Link to="/creator/onboarding">Set up your profile</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="creator">
      <header className="mb-6">
        <h1 className="text-heading font-bold text-foreground">Access Control</h1>
        <p className="text-support text-muted-foreground mt-0.5">
          Close sales or cap new subscribers. Existing members keep their access.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <PackageOpen className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-ui font-semibold text-foreground mb-2">No active products yet</h3>
          <p className="text-support text-muted-foreground max-w-sm mx-auto mb-5">
            Create a product first, then return here to set limits and exclusivity.
          </p>
          <Button asChild className="min-h-11">
            <Link to="/creator/products">Go to Products</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((product) => {
            const spotsLeft =
              product.is_limited && product.max_spots !== null
                ? Math.max(product.max_spots - product.taken, 0)
                : null;
            const fillPercent = product.max_spots
              ? Math.min((product.taken / product.max_spots) * 100, 100)
              : 0;
            const isUrgent = spotsLeft !== null && spotsLeft <= 10;
            const busy = savingId === product.id;
            const limitId = `limit-${product.id}`;
            const spotsId = `spots-${product.id}`;

            return (
              <div key={product.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-ui font-semibold text-foreground">{product.name}</h3>
                      {product.is_closed && (
                        <Badge
                          variant="outline"
                          className="text-caption bg-destructive/10 text-destructive border-destructive/20"
                        >
                          <Lock className="h-2.5 w-2.5 mr-1" /> Closed
                        </Badge>
                      )}
                      {isUrgent && !product.is_closed && (
                        <Badge
                          variant="outline"
                          className="text-caption bg-amber-500/10 text-amber-500 border-amber-500/20"
                        >
                          <AlertTriangle className="h-2.5 w-2.5 mr-1" /> {spotsLeft} spots left
                        </Badge>
                      )}
                      {!product.is_limited && (
                        <Badge
                          variant="outline"
                          className="text-caption bg-muted text-muted-foreground border-border"
                        >
                          Unlimited
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-support text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {product.taken} subscribers
                      </span>
                      {product.is_limited && product.max_spots != null && (
                        <span>of {product.max_spots} spots</span>
                      )}
                      <span>${product.price.toFixed(2)}/mo</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={product.is_closed ? 'hero' : 'outline'}
                    className="min-h-11 shrink-0"
                    disabled={busy}
                    onClick={() =>
                      void patch(
                        product.id,
                        { isClosed: !product.is_closed },
                        product.is_closed ? 'Product reopened for new sales' : 'Closed to new sales',
                      )
                    }
                  >
                    {busy ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : product.is_closed ? (
                      <Unlock className="mr-1.5 h-3.5 w-3.5" />
                    ) : (
                      <Lock className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {product.is_closed ? 'Reopen' : 'Close'}
                  </Button>
                </div>

                <p className="text-support text-muted-foreground">
                  {product.is_closed
                    ? 'Closed stops new purchases. Existing subscribers keep access.'
                    : 'Open for new purchases. Closing later does not remove current members.'}
                </p>

                {product.is_limited && product.max_spots != null && product.max_spots > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-support text-muted-foreground mb-1.5">
                      <span>
                        {product.taken} / {product.max_spots} filled
                      </span>
                      <span>{Math.round(fillPercent)}%</span>
                    </div>
                    <Progress value={fillPercent} className="h-2" />
                    {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 10 && (
                      <p className="text-support text-amber-500 mt-2 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Only {spotsLeft} spots remaining for new subscribers
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center border-t border-border pt-4">
                  <div className="flex items-center gap-3 min-h-11">
                    <Switch
                      id={limitId}
                      checked={product.is_limited}
                      disabled={busy}
                      onCheckedChange={() =>
                        void patch(
                          product.id,
                          {
                            isLimited: !product.is_limited,
                            maxSpots: !product.is_limited
                              ? (product.max_spots ?? 100)
                              : product.max_spots,
                          },
                          'Access limit updated',
                        )
                      }
                    />
                    <Label htmlFor={limitId} className="text-support text-muted-foreground cursor-pointer">
                      Limit subscriber count
                    </Label>
                  </div>
                  {product.is_limited && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor={spotsId} className="text-support text-muted-foreground shrink-0">
                        Max spots
                      </Label>
                      <Input
                        id={spotsId}
                        type="number"
                        min={1}
                        disabled={busy}
                        className="h-11 min-h-11 w-28 text-ui"
                        value={product.max_spots ?? ''}
                        onChange={(e) =>
                          setDraftSpots((prev) => ({
                            ...prev,
                            [product.id]: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                        onBlur={() =>
                          void patch(product.id, { maxSpots: product.max_spots }, 'Spot limit saved')
                        }
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
