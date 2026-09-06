import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Navbar } from '@/components/landing/Navbar';
import { Seo } from '@/components/Seo';
import { Footer } from '@/components/landing/Footer';
import { Crown, Loader2, Users } from 'lucide-react';

const Creators = () => {
  const creators = useQuery(api.creators.queries.listPublished, {});

  return (
    <div className="min-h-screen bg-background">
      <Seo title={'Top Sports Creators on Wizzlet'} description={'Browse verified creators on Wizzlet, compare win rates and units, and subscribe to the handicappers you trust.'} />
      <Navbar />
      <main id="main-content" className="container pt-32 pb-20 max-w-4xl">
        <p className="text-xs font-medium uppercase tracking-widest text-primary mb-4">Creators</p>
        <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">Top performers on the platform</h1>
        <p className="text-muted-foreground mb-12">Published creators on Wizzlet. Profiles come from the live database.</p>

        {creators === undefined ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : creators.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">No published creators yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {creators.map((c) => {
              const name = c.displayName ?? c.username;
              return (
                <Link
                  key={c._id}
                  to={`/c/${c.username}`}
                  className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-11 w-11 rounded-full bg-primary/15 flex items-center justify-center shrink-0 overflow-hidden">
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-primary">{name[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{name}</p>
                      <p className="text-xs text-muted-foreground">@{c.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {c.verificationStatus === 'verified' && (
                      <span className="flex items-center gap-1"><Crown className="h-3 w-3" /> Verified</span>
                    )}
                    {c.monthlyPriceCents != null && (
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> ${(c.monthlyPriceCents / 100).toFixed(2)}/mo</span>
                    )}
                  </div>
                  {c.bio && <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{c.bio}</p>}
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Creators;
