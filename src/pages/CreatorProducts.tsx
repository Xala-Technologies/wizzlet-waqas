import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import ProductsSection from '@/components/creator/ProductsSection';

const CreatorProducts = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [creatorId, setCreatorId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: userData } = await supabase.from('users').select('id').eq('auth_id', user.id).maybeSingle();
      if (!userData) { setLoading(false); return; }
      const { data: creator } = await supabase.from('creators').select('id').eq('user_id', userData.id).maybeSingle();
      if (!creator) { setLoading(false); return; }
      setCreatorId(creator.id);
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <DashboardLayout type="creator">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your pricing plans and products</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : creatorId ? (
        <ProductsSection creatorId={creatorId} />
      ) : (
        <p className="text-muted-foreground text-sm">Creator profile not found.</p>
      )}
    </DashboardLayout>
  );
};

export default CreatorProducts;
