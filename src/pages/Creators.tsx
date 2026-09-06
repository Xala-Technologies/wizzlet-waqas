import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Navbar } from '@/components/landing/Navbar';
import { Seo } from '@/components/Seo';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Loader2, Search } from 'lucide-react';

const Creators = () => {
  const creatorsPage = useQuery(api.creators.queries.listPublished, {});
  const creators = creatorsPage?.items;
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!creators) return [];
    const q = search.trim().toLowerCase();
    if (!q) return creators;
    return creators.filter(
      (c) =>
        c.username.toLowerCase().includes(q) ||
        (c.displayName ?? '').toLowerCase().includes(q) ||
        (c.bio ?? '').toLowerCase().includes(q),
    );
  }, [creators, search]);

  return (
    <div className="flex min-h-screen flex-col bg-noise">
      <Seo
        title="Top Sports Creators on Wizzlet"
        description="Browse verified creators on Wizzlet, compare win rates and units, and subscribe to the handicappers you trust."
      />
      <Navbar />

      <main id="main-content" className="relative flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,hsl(var(--primary)/0.10),transparent)]" />

        <section className="container relative pt-28 pb-10 md:pt-32 md:pb-14">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-primary">
            Wizzlet · Creators
          </p>
          <h1 className="max-w-2xl text-4xl font-extrabold tracking-[-0.04em] text-foreground sm:text-5xl">
            Creators who publish with an edge
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Live profiles from the Wizzlet network. Subscribe for gated picks — no algorithm,
            no public feed noise.
          </p>

          <div className="relative mt-10 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or handle…"
              className="h-11 pl-10"
              aria-label="Search creators"
            />
          </div>
        </section>

        <section className="container relative pb-16 md:pb-20">
          {creatorsPage === undefined ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : !creators || creators.length === 0 ? (
            <div className="mx-auto max-w-lg py-16 text-center">
              <p className="text-lg font-semibold tracking-tight text-foreground">
                The roster is still forming
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Published creators appear here as soon as they go live. If you have an edge worth
                charging for, apply for access.
              </p>
              <Link to="/signup" className="mt-8 inline-block">
                <Button variant="hero" className="gap-2">
                  Apply for access <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No creators match “{search.trim()}”.
            </p>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {filtered.map((c) => {
                const name = c.displayName ?? c.username;
                const price =
                  c.monthlyPriceCents != null
                    ? `$${(c.monthlyPriceCents / 100).toFixed(0)}/mo`
                    : null;
                return (
                  <li key={c._id}>
                    <Link
                      to={`/c/${c.username}`}
                      className="group flex flex-col gap-4 py-5 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-6"
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/12 text-sm font-bold text-primary">
                          {c.avatarUrl ? (
                            <img src={c.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            name[0]?.toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {name}
                            </span>
                            <span className="text-[13px] text-muted-foreground">@{c.username}</span>
                            {c.verificationStatus === 'verified' && (
                              <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
                                Verified
                              </span>
                            )}
                          </div>
                          {c.bio ? (
                            <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                              {c.bio}
                            </p>
                          ) : null}
                          <p className="mt-2 text-[12px] text-muted-foreground/80">
                            {c.postCount} {c.postCount === 1 ? 'pick' : 'picks'} published
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-4 pl-16 sm:pl-0">
                        {price && (
                          <span className="font-mono text-[13px] tabular-nums text-foreground">
                            {price}
                          </span>
                        )}
                        <span className="text-[12px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          View profile →
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="border-t border-border bg-card/40">
          <div className="container flex flex-col items-start justify-between gap-6 py-12 md:flex-row md:items-center md:py-14">
            <div className="max-w-md">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Have a record worth selling?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Wizzlet is invite-only infrastructure — not another public tip board.
              </p>
            </div>
            <Link to="/signup">
              <Button variant="hero" size="lg" className="gap-2">
                Apply for access <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Creators;
