import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Loader2 } from 'lucide-react';
import ProductsSection from '@/components/creator/ProductsSection';

const CreatorProducts = () => {
  const creator = useQuery(api.creators.queries.myCreator);

  return (
    <DashboardLayout type="creator">
      {creator === undefined ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : creator ? (
        <ProductsSection creatorId={creator._id} />
      ) : (
        <p className="text-support text-muted-foreground">Creator profile not found.</p>
      )}
    </DashboardLayout>
  );
};

export default CreatorProducts;
