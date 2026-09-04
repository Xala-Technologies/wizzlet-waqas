import { Navbar } from '@/components/landing/Navbar';
import { Seo } from '@/components/Seo';
import { Footer } from '@/components/landing/Footer';
import { Crown, TrendingUp, Users } from 'lucide-react';

const demoCreators = [
  { name: 'SharpShooter Picks', handle: '@sharpshooter', subscribers: 312, winRate: '68%', sport: 'NFL' },
  { name: 'ProPlays Daily', handle: '@proplays', subscribers: 189, winRate: '72%', sport: 'NBA' },
  { name: 'ClutchKing Analytics', handle: '@clutchking', subscribers: 244, winRate: '65%', sport: 'MLB' },
  { name: 'IronLock Bets', handle: '@ironlock', subscribers: 156, winRate: '71%', sport: 'Soccer' },
  { name: 'OverEdge Picks', handle: '@overedge', subscribers: 98, winRate: '63%', sport: 'MMA' },
  { name: 'StatLine Pro', handle: '@statlinepro', subscribers: 421, winRate: '74%', sport: 'NFL' },
];

const Creators = () => (
  <div className="min-h-screen bg-background">
    <Seo title={'Top Sports Creators on Wizzlet'} description={'Browse verified creators on Wizzlet, compare win rates and units, and subscribe to the handicappers you trust.'} />
      <Navbar />
    <main id="main-content" className="container pt-32 pb-20 max-w-4xl">
      <p className="text-xs font-medium uppercase tracking-widest text-primary mb-4">Creators</p>
      <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">Top performers on the platform</h1>
      <p className="text-muted-foreground mb-12">Verified creators with proven track records. Every profile is manually reviewed.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {demoCreators.map((c) => (
          <div key={c.handle} className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">{c.name[0]}</span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.handle}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.subscribers}</span>
              <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {c.winRate}</span>
              <span className="flex items-center gap-1"><Crown className="h-3 w-3" /> {c.sport}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
    <Footer />
  </div>
);

export default Creators;
