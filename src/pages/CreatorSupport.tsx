import { useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  CreditCard,
  FileText,
  Mail,
  MessageCircle,
  Search,
  Send,
  Settings,
  Users,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupportChat } from '@/contexts/SupportChatContext';
import { clayCard, clayCardInteractive } from '@/lib/overviewClay';
import { kpiIconTone } from '@/lib/kpiIconTones';
import {
  CREATOR_SUPPORT_ARTICLES,
  CREATOR_SUPPORT_CATEGORIES,
  CREATOR_SUPPORT_POPULAR_IDS,
  type SupportCategory,
} from '@/lib/creatorSupportDemo';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  book: BookOpen,
  wallet: CreditCard,
  users: Users,
  discord: MessageCircle,
  send: Send,
  settings: Settings,
} as const;

const TONE_MAP = {
  book: kpiIconTone.violet,
  wallet: kpiIconTone.sky,
  users: kpiIconTone.emerald,
  discord: kpiIconTone.violet,
  send: kpiIconTone.sky,
  settings: kpiIconTone.amber,
} as const;

function matchesQuery(text: string, q: string): boolean {
  if (!q) return true;
  return text.toLowerCase().includes(q);
}

const CreatorSupport = () => (
  <DashboardLayout type="creator" mainClassName="bg-clay-page">
    <CreatorSupportBody />
  </DashboardLayout>
);

function CreatorSupportBody() {
  const { openChat } = useSupportChat();
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [articleId, setArticleId] = useState<string | null>(null);
  const q = query.trim().toLowerCase();

  const categories = useMemo(
    () => CREATOR_SUPPORT_CATEGORIES.filter((c) => matchesQuery(`${c.title} ${c.description}`, q)),
    [q],
  );

  const articles = useMemo(() => {
    let rows = CREATOR_SUPPORT_ARTICLES;
    if (categoryId) rows = rows.filter((a) => a.categoryId === categoryId);
    if (q) rows = rows.filter((a) => matchesQuery(`${a.title} ${a.body}`, q));
    return rows;
  }, [categoryId, q]);

  const popular = useMemo(() => {
    const byId = new Map(CREATOR_SUPPORT_ARTICLES.map((a) => [a.id, a]));
    return CREATOR_SUPPORT_POPULAR_IDS.map((id) => byId.get(id)).filter(
      (a): a is NonNullable<typeof a> => Boolean(a) && matchesQuery(`${a.title} ${a.body}`, q),
    );
  }, [q]);

  const selected = CREATOR_SUPPORT_ARTICLES.find((a) => a.id === articleId) ?? null;
  const selectedCategory = CREATOR_SUPPORT_CATEGORIES.find((c) => c.id === categoryId) ?? null;

  const openCategory = (category: SupportCategory) => {
    setCategoryId(category.id);
    setArticleId(null);
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Support Center
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          We&apos;re here to help you grow on Prizelet.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for help (e.g. payouts, Discord, subscriptions…)"
              aria-label="Search help"
              className="h-12 rounded-xl border-border bg-card pl-10 text-sm shadow-[var(--shadow-card)]"
            />
          </div>

          {selected ? (
            <section className={cn(clayCard, 'p-5 sm:p-6')}>
              <button
                type="button"
                className="mb-4 text-sm font-semibold text-primary hover:underline"
                onClick={() => setArticleId(null)}
              >
                Back to articles
              </button>
              <h2 className="text-xl font-extrabold tracking-tight text-foreground">
                {selected.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{selected.body}</p>
              <Button type="button" className="mt-6 min-h-11 rounded-xl" onClick={openChat}>
                Start a conversation
              </Button>
            </section>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {categories.map((category) => {
                  const Icon = ICON_MAP[category.icon];
                  const active = categoryId === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => openCategory(category)}
                      className={cn(
                        clayCardInteractive,
                        'flex min-h-[5.5rem] items-center gap-3.5 px-4 py-4 text-left',
                        active && 'ring-2 ring-primary/30',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                          TONE_MAP[category.icon],
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-extrabold text-foreground">
                          {category.title}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                          {category.description}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    </button>
                  );
                })}
              </div>

              <section className={cn(clayCard, 'p-5')}>
                <h2 className="mb-3 text-base font-extrabold tracking-tight text-foreground">
                  {selectedCategory ? selectedCategory.title : 'Popular articles'}
                </h2>
                <ul>
                  {(categoryId ? articles : popular).map((article) => (
                    <li key={article.id} className="border-b border-border last:border-0">
                      <button
                        type="button"
                        onClick={() => setArticleId(article.id)}
                        className="flex min-h-11 w-full items-center gap-3 py-3 text-left"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="flex-1 text-sm font-semibold text-foreground">
                          {article.title}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
                {categoryId ? (
                  <button
                    type="button"
                    className="mt-2 text-sm font-semibold text-primary hover:underline"
                    onClick={() => setCategoryId(null)}
                  >
                    All topics
                  </button>
                ) : null}
                {(categoryId ? articles : popular).length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">No articles match that search.</p>
                ) : null}
              </section>
            </>
          )}
        </div>

        <aside className="xl:col-span-4">
          <section className={cn(clayCard, 'p-5')}>
            <h2 className="text-base font-extrabold tracking-tight text-foreground">
              Contact our team
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Need further help? Our team usually replies within a few hours.
            </p>
            <Button
              type="button"
              className="mt-4 min-h-11 w-full gap-2 rounded-xl"
              onClick={openChat}
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Start a conversation
            </Button>
            <a
              href="mailto:support@prizelet.com"
              className="mt-3 flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="h-4 w-4" aria-hidden />
              Email us
              <span className="font-medium">support@prizelet.com</span>
            </a>
          </section>
        </aside>
      </div>
    </>
  );
}

export default CreatorSupport;
