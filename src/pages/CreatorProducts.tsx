import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Loader2 } from 'lucide-react';
import ProductsSection from '@/components/creator/ProductsSection';

const CreatorProducts = () => {
  const creator = useQuery(api.creators.queries.myCreator);

  return (
    <DashboardLayout type="creator">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your pricing plans and products</p>
      </div>
      {creator === undefined ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : creator ? (
        <ProductsSection creatorId={creator._id} />
      ) : (
        <p className="text-muted-foreground text-sm">Creator profile not found.</p>
      )}
    </DashboardLayout>
  );
};

export default CreatorProducts;
