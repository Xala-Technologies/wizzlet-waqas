import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Star, Crown, TrendingUp, Bookmark } from 'lucide-react';
import DemoMemberShell from '@/components/demo/DemoMemberShell';
import { useDemoMemberStore } from '@/components/demo/demoMemberStore';
import CancelSubButton from '@/components/demo/CancelSubButton';

const DemoMemberDiscover = () => {
  const store = useDemoMemberStore();
  const { state } = store;
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(state.creators.map(c => c.category)))];

  const ranked = [...state.creators].sort((a, b) => parseFloat(b.growth) - parseFloat(a.growth));
  const trending = ranked.slice(0, 3);

  const filtered = state.creators.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.bio.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || c.category === category;
    return matchSearch && matchCat;
  });

  const SubButton = ({ id, name }: { id: string; name: string }) =>
    store.isSubscribed(id) ? (
      <CancelSubButton creatorId={id} variant="status" />
    ) : (
      <Button size="sm" className="h-7 text-xs" onClick={() => { store.subscribe(id); toast.success(`Subscribed to ${name}`); }}>
        <Crown className="mr-1 h-3 w-3" /> Subscribe
      </Button>
    );

  return (
    <DemoMemberShell title="Discover Creators" subtitle="Find top-performing creators and grow your portfolio">
      <div className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-primary" /> Trending This Week
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {trending.map((c, i) => (
            <div key={c.id} className="rounded-xl border border-primary/20 bg-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">#{i + 1}</span>
                <Badge variant="outline" className="text-[8px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  <TrendingUp className="h-2 w-2 mr-0.5" /> {c.growth}
                </Badge>
                <button onClick={() => store.toggleBookmark(c.id)} aria-label={`${state.bookmarkedCreatorIds.includes(c.id) ? 'Remove' : 'Save'} ${c.name}`} className="ml-auto p-2 -m-2 text-muted-foreground hover:text-primary">
                  <Bookmark className={`h-3.5 w-3.5 ${state.bookmarkedCreatorIds.includes(c.id) ? 'fill-current text-primary' : ''}`} />
                </button>
              </div>
              <div className="flex items-start gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{c.name[0]}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate flex items-center gap-1">
                    {c.name} <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  </p>
                  <p className="text-[10px] text-muted-foreground">{c.subs} subscribers · {c.winRate}% win rate</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{c.bio}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-primary">${c.price}/mo</span>
                <SubButton id={c.id} name={c.name} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search creators…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                category === cat ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >{cat}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No creators match “{search}”.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map(c => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-11 w-11 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-base font-bold text-primary">{c.name[0]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground">@{c.username} · {c.subs} subs · {c.winRate}% win rate</p>
                </div>
                <button onClick={() => store.toggleBookmark(c.id)} aria-label={`${state.bookmarkedCreatorIds.includes(c.id) ? 'Remove' : 'Save'} ${c.name}`} className="p-2 -m-2 text-muted-foreground hover:text-primary">
                  <Bookmark className={`h-4 w-4 ${state.bookmarkedCreatorIds.includes(c.id) ? 'fill-current text-primary' : ''}`} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{c.bio}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-primary">${c.price}/mo</span>
                <SubButton id={c.id} name={c.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </DemoMemberShell>
  );
};

export default DemoMemberDiscover;
