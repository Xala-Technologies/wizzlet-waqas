import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Users, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Subscriber {
  id: string;
  status: string;
  created_at: string;
  user: { email: string; full_name: string | null } | null;
}

const CreatorSubscribers = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: userData } = await supabase.from('users').select('id').eq('auth_id', user.id).maybeSingle();
      if (!userData) { setLoading(false); return; }
      const { data: creator } = await supabase.from('creators').select('id').eq('user_id', userData.id).maybeSingle();
      if (!creator) { setLoading(false); return; }

      const { data } = await supabase
        .from('subscriptions')
        .select('id, status, created_at, user_id')
        .eq('creator_id', creator.id)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        const userIds = data.map(s => s.user_id);
        const { data: usersData } = await supabase.from('users').select('id, email, full_name').in('id', userIds);
        const userMap = new Map((usersData ?? []).map(u => [u.id, u]));
        setSubscribers(data.map(s => ({ ...s, user: userMap.get(s.user_id) ?? null })));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const activeCount = subscribers.filter(s => s.status === 'active').length;

  return (
    <DashboardLayout type="creator">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Subscribers</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{activeCount} active · {subscribers.length} total</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : subscribers.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No subscribers yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Share your profile link to attract subscribers.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Subscriber</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Joined</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map(sub => (
                <tr key={sub.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="p-4">
                    <p className="text-sm font-medium">{sub.user?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{sub.user?.email}</p>
                  </td>
                  <td className="p-4">
                    {sub.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <XCircle className="h-3 w-3" /> {sub.status}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">{format(new Date(sub.created_at), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CreatorSubscribers;
