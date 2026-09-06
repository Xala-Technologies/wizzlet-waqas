import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { Tag, Loader2 } from 'lucide-react';

const CreatorPromo = () => {
  const { loading: creatorLoading } = useCreatorProfile();
  const promos = useQuery(api.creators.growth.listMyPromos);
  const loading = creatorLoading || promos === undefined;

  return (
    <DashboardLayout type="creator">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Promo Codes</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Coming soon — checkout does not apply promo discounts yet.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Tag className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">Promo redemption unavailable</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Codes and referral commercial claims stay disabled until Stripe Checkout applies them
            end-to-end.
            {promos && promos.length > 0
              ? ` You have ${promos.length} stored code(s) that will not discount checkout.`
              : ''}
          </p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CreatorPromo;
