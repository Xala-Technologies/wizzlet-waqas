import { americanToDecimal } from '@/lib/odds';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * In-memory (session-persisted) data layer for the Member demo.
 * Mirrors the real member dashboard logic — subscriptions gating premium
 * content, saved posts, tracked picks with ROI/units maths, notifications
 * and activity — without touching the database.
 */

export type PickResult = 'pending' | 'won' | 'lost' | 'push';

export interface DemoMemberCreator {
  id: string;
  name: string;
  username: string;
  bio: string;
  price: number;
  subs: number;
  category: string;
  growth: string;
  winRate: number;
  featured: boolean;
}

export interface DemoFeedPost {
  id: string;
  creatorId: string;
  title: string;
  preview: string;
  content: string;
  sport: string;
  event: string;
  usOdds: string;
  units: number;
  isPremium: boolean;
  result: PickResult;
  createdAt: string;
  likes: number;
  views: number;
}

export interface DemoTrackedPick {
  id: string;
  postId: string | null;
  creatorId: string;
  event: string;
  sport: string;
  usOdds: string;
  units: number;
  result: PickResult;
  date: string;
}

export interface DemoMemberNotification {
  id: string;
  type: 'post' | 'price' | 'promo' | 'announcement';
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
}

export interface DemoActivityEntry {
  id: string;
  type: 'save' | 'track' | 'subscribe' | 'unsubscribe' | 'like' | 'settle';
  label: string;
  createdAt: string;
}

export interface DemoMemberSettings {
  displayName: string;
  username: string;
  email: string;
  emailOnNewPost: boolean;
  emailOnPromo: boolean;
  productUpdates: boolean;
  defaultUnitSize: number;
}

export interface DemoMemberState {
  creators: DemoMemberCreator[];
  subscribedCreatorIds: string[];
  bookmarkedCreatorIds: string[];
  posts: DemoFeedPost[];
  savedPostIds: string[];
  likedPostIds: string[];
  tracked: DemoTrackedPick[];
  notifications: DemoMemberNotification[];
  activity: DemoActivityEntry[];
  settings: DemoMemberSettings;
}

const day = 86400000;
const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * day).toISOString();

/** American odds -> decimal (EU) odds. */
export { americanToDecimal as usToDecimal } from '@/lib/odds';

/** Units won/lost for a settled tracked pick. */
export const unitsFor = (p: { usOdds: string; units: number; result: PickResult }): number => {
  const dec = americanToDecimal(p.usOdds);
  if (!dec) return 0;
  if (p.result === 'won') return +((dec - 1) * p.units).toFixed(2);
  if (p.result === 'lost') return -p.units;
  return 0;
};

const seed = (): DemoMemberState => ({
  creators: [
    { id: 'c1', name: 'SharpShooter Picks', username: 'sharpshooter', bio: 'NFL & NBA prop specialist. 62% hit rate across 500+ tracked picks.', price: 14.99, subs: 342, category: 'Sports', growth: '+24%', winRate: 62, featured: true },
    { id: 'c2', name: 'ProPlays Daily', username: 'proplays', bio: 'Daily plays across all major sports with full analysis and breakdowns.', price: 9.99, subs: 218, category: 'Sports', growth: '+8%', winRate: 56, featured: false },
    { id: 'c3', name: 'ClutchKing Analytics', username: 'clutchking', bio: 'Data-driven approaches to tournament brackets and season-long plays.', price: 19.99, subs: 156, category: 'Analytics', growth: '+18%', winRate: 58, featured: true },
    { id: 'c4', name: 'PickMaster Elite', username: 'pickmaster', bio: 'High-stakes plays with detailed risk analysis. Quality over quantity.', price: 24.99, subs: 203, category: 'Premium', growth: '+15%', winRate: 60, featured: true },
    { id: 'c5', name: 'The Edge Report', username: 'edgereport', bio: 'Weekly deep-dive newsletters covering market movements and value spots.', price: 7.99, subs: 445, category: 'Newsletter', growth: '+12%', winRate: 54, featured: false },
    { id: 'c6', name: 'StatMaster', username: 'statmaster', bio: 'Advanced statistical models for NFL and college football analysis.', price: 16.99, subs: 134, category: 'Analytics', growth: '+9%', winRate: 57, featured: false },
    { id: 'c7', name: 'DailyValue Plays', username: 'dailyvalue', bio: 'Affordable, consistent picks with detailed value breakdowns daily.', price: 5.99, subs: 567, category: 'Sports', growth: '+20%', winRate: 53, featured: false },
  ],
  subscribedCreatorIds: ['c1', 'c2', 'c3'],
  bookmarkedCreatorIds: ['c4', 'c5'],
  posts: [
    { id: 'f1', creatorId: 'c1', title: 'LOCK OF THE DAY: Chiefs -3.5 — full breakdown inside', preview: 'Line moved from -2.5 overnight; the sharp side is clear.', content: 'Chiefs -3.5 at -110. Line moved from -2.5 overnight on limited ticket count — classic sharp money signal. Raiders are 1-5 ATS as road dogs this season.', sport: 'NFL', event: 'Chiefs vs Raiders', usOdds: '-110', units: 3, isPremium: true, result: 'pending', createdAt: iso(0.1), likes: 74, views: 612 },
    { id: 'f2', creatorId: 'c2', title: 'NBA player props: 3 best value plays tonight', preview: 'Pace-up spots create the softest prop lines of the week.', content: 'Main play: Jokic over 9.5 assists (-115). Back-to-back pace spike and no backup PG available.', sport: 'NBA', event: 'Nuggets vs Suns', usOdds: '-115', units: 2, isPremium: true, result: 'pending', createdAt: iso(0.3), likes: 41, views: 388 },
    { id: 'f3', creatorId: 'c1', title: 'NFL Week 14: top 3 player props to target', preview: 'Mahomes over 1.5 passing TDs is the cleanest number on the board.', content: 'Mahomes over 1.5 passing TDs at -140. Chiefs are 8-1 to the over at home in this spot.', sport: 'NFL', event: 'Chiefs vs Bills', usOdds: '-140', units: 2, isPremium: true, result: 'won', createdAt: iso(1), likes: 48, views: 312 },
    { id: 'f4', creatorId: 'c2', title: 'Free pick: Lakers vs Celtics under 221.5', preview: 'Both teams on a back-to-back — pace collapses in these spots.', content: 'Under 221.5 at +100. Both teams played last night; this total is 4 points too high.', sport: 'NBA', event: 'Lakers vs Celtics', usOdds: '+100', units: 1, isPremium: false, result: 'lost', createdAt: iso(2), likes: 32, views: 745 },
    { id: 'f5', creatorId: 'c3', title: 'March Madness bracket strategy 2026', preview: 'Data-driven bracket building methodology for the tournament.', content: 'Full model breakdown: seed value, tempo mismatch and free-throw variance weighting.', sport: 'NCAAB', event: 'Tournament preview', usOdds: '-120', units: 2, isPremium: true, result: 'won', createdAt: iso(3), likes: 55, views: 378 },
    { id: 'f6', creatorId: 'c1', title: 'How I handicap totals — free guide', preview: 'My complete methodology for analysing over/unders.', content: 'Start with pace, then injuries, then weather. Never bet a total before checking the closing line history.', sport: 'Education', event: 'Guide', usOdds: '', units: 0, isPremium: false, result: 'pending', createdAt: iso(5), likes: 91, views: 1930 },
    { id: 'f7', creatorId: 'c3', title: 'Fading public totals in the postseason', preview: 'Playoff bullpens change everything.', content: 'Postseason bullpen usage collapses run expectancy. Unders hit at 58% in October since 2019.', sport: 'MLB', event: 'Series preview', usOdds: '-105', units: 2, isPremium: true, result: 'won', createdAt: iso(6), likes: 39, views: 517 },
  ],
  savedPostIds: ['f3', 'f5', 'f6'],
  likedPostIds: ['f3'],
  tracked: [
    { id: 't1', postId: 'f3', creatorId: 'c1', event: 'Chiefs vs Bills', sport: 'NFL', usOdds: '-140', units: 2, result: 'won', date: iso(1) },
    { id: 't2', postId: 'f4', creatorId: 'c2', event: 'Lakers vs Celtics', sport: 'NBA', usOdds: '+100', units: 1, result: 'lost', date: iso(2) },
    { id: 't3', postId: 'f5', creatorId: 'c3', event: 'Tournament preview', sport: 'NCAAB', usOdds: '-120', units: 2, result: 'won', date: iso(3) },
    { id: 't4', postId: 'f7', creatorId: 'c3', event: 'Series preview', sport: 'MLB', usOdds: '-105', units: 2, result: 'won', date: iso(6) },
    { id: 't5', postId: null, creatorId: 'c1', event: 'Packers vs Lions', sport: 'NFL', usOdds: '-110', units: 1, result: 'won', date: iso(8) },
    { id: 't6', postId: null, creatorId: 'c2', event: 'Warriors vs Kings', sport: 'NBA', usOdds: '+120', units: 1, result: 'lost', date: iso(9) },
    { id: 't7', postId: null, creatorId: 'c1', event: 'Bills vs Jets', sport: 'NFL', usOdds: '-105', units: 2, result: 'won', date: iso(12) },
  ],
  notifications: [
    { id: 'n1', type: 'post', title: 'New post from SharpShooter Picks', description: 'LOCK OF THE DAY: Chiefs -3.5 — full breakdown inside', createdAt: iso(0.1), read: false },
    { id: 'n2', type: 'promo', title: 'ProPlays Daily — 20% off', description: 'Use code WELCOME20 for 20% off your first month', createdAt: iso(0.2), read: false },
    { id: 'n3', type: 'post', title: 'New post from ClutchKing Analytics', description: 'March Madness bracket strategy 2026', createdAt: iso(1), read: false },
    { id: 'n4', type: 'price', title: 'Price update: SharpShooter Picks', description: 'Monthly subscription changed from $12.99 to $14.99', createdAt: iso(2), read: true },
    { id: 'n5', type: 'announcement', title: 'Platform update', description: 'The My Results tracker is now live — track any pick from your feed.', createdAt: iso(3), read: true },
  ],
  activity: [
    { id: 'a1', type: 'track', label: 'Tracked Chiefs vs Bills (2u @ -140)', createdAt: iso(1) },
    { id: 'a2', type: 'save', label: 'Saved “March Madness bracket strategy 2026”', createdAt: iso(3) },
    { id: 'a3', type: 'subscribe', label: 'Subscribed to ClutchKing Analytics', createdAt: iso(11) },
  ],
  settings: {
    displayName: 'Alex Morgan',
    username: 'alexm',
    email: 'alex@example.com',
    emailOnNewPost: true,
    emailOnPromo: false,
    productUpdates: true,
    defaultUnitSize: 1,
  },
});

const KEY = 'wizzlet.demo.member.v1';

const load = (): DemoMemberState => {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DemoMemberState;
  } catch { /* ignore */ }
  return seed();
};

/** Unread notification count without mounting the whole store. */
export const demoMemberUnread = (): number => load().notifications.filter(n => !n.read).length;

function useDemoMemberStoreState() {
  const [state, setState] = useState<DemoMemberState>(load);

  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const logActivity = (s: DemoMemberState, type: DemoActivityEntry['type'], label: string): DemoMemberState => ({
    ...s,
    activity: [{ id: `a${Date.now()}${Math.random()}`, type, label, createdAt: new Date().toISOString() }, ...s.activity].slice(0, 60),
  });

  const reset = useCallback(() => setState(seed()), []);

  const creatorById = useCallback((id: string) => state.creators.find(c => c.id === id), [state.creators]);

  const isSubscribed = useCallback((id: string) => state.subscribedCreatorIds.includes(id), [state.subscribedCreatorIds]);

  const subscribe = useCallback((creatorId: string) => {
    setState(s => {
      if (s.subscribedCreatorIds.includes(creatorId)) return s;
      const creator = s.creators.find(c => c.id === creatorId);
      const next = { ...s, subscribedCreatorIds: [...s.subscribedCreatorIds, creatorId] };
      return logActivity(next, 'subscribe', `Subscribed to ${creator?.name ?? 'creator'}`);
    });
  }, []);

  const unsubscribe = useCallback((creatorId: string) => {
    setState(s => {
      const creator = s.creators.find(c => c.id === creatorId);
      const next = { ...s, subscribedCreatorIds: s.subscribedCreatorIds.filter(id => id !== creatorId) };
      return logActivity(next, 'unsubscribe', `Cancelled ${creator?.name ?? 'creator'}`);
    });
  }, []);

  const toggleBookmark = useCallback((creatorId: string) => {
    setState(s => ({
      ...s,
      bookmarkedCreatorIds: s.bookmarkedCreatorIds.includes(creatorId)
        ? s.bookmarkedCreatorIds.filter(id => id !== creatorId)
        : [...s.bookmarkedCreatorIds, creatorId],
    }));
  }, []);

  const toggleSave = useCallback((postId: string) => {
    setState(s => {
      const saved = s.savedPostIds.includes(postId);
      const post = s.posts.find(p => p.id === postId);
      const next = {
        ...s,
        savedPostIds: saved ? s.savedPostIds.filter(id => id !== postId) : [postId, ...s.savedPostIds],
      };
      return saved ? next : logActivity(next, 'save', `Saved “${post?.title ?? 'post'}”`);
    });
  }, []);

  const toggleLike = useCallback((postId: string) => {
    setState(s => {
      const liked = s.likedPostIds.includes(postId);
      return {
        ...s,
        likedPostIds: liked ? s.likedPostIds.filter(id => id !== postId) : [postId, ...s.likedPostIds],
        posts: s.posts.map(p => (p.id === postId ? { ...p, likes: p.likes + (liked ? -1 : 1) } : p)),
      };
    });
  }, []);

  const trackPick = useCallback((entry: Omit<DemoTrackedPick, 'id' | 'date' | 'result'> & { result?: PickResult }) => {
    setState(s => {
      const next = {
        ...s,
        tracked: [{
          ...entry,
          result: entry.result ?? 'pending',
          id: `t${Date.now()}`,
          date: new Date().toISOString(),
        }, ...s.tracked],
      };
      return logActivity(next, 'track', `Tracked ${entry.event} (${entry.units}u @ ${entry.usOdds || 'n/a'})`);
    });
  }, []);

  const setTrackedResult = useCallback((id: string, result: PickResult) => {
    setState(s => {
      const pick = s.tracked.find(t => t.id === id);
      const next = { ...s, tracked: s.tracked.map(t => (t.id === id ? { ...t, result } : t)) };
      return pick ? logActivity(next, 'settle', `Settled ${pick.event} as ${result}`) : next;
    });
  }, []);

  const removeTracked = useCallback((id: string) => {
    setState(s => ({ ...s, tracked: s.tracked.filter(t => t.id !== id) }));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setState(s => ({ ...s, notifications: s.notifications.map(n => (n.id === id ? { ...n, read: true } : n)) }));
  }, []);

  const markAllRead = useCallback(() => {
    setState(s => ({ ...s, notifications: s.notifications.map(n => ({ ...n, read: true })) }));
  }, []);

  const updateSettings = useCallback((patch: Partial<DemoMemberSettings>) => {
    setState(s => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const metrics = useMemo(() => {
    const settled = state.tracked.filter(t => t.result === 'won' || t.result === 'lost');
    const wins = settled.filter(t => t.result === 'won').length;
    const unitsNet = state.tracked.reduce((sum, t) => sum + unitsFor(t), 0);
    const staked = settled.reduce((sum, t) => sum + t.units, 0);

    // Longest current win streak (most recent first).
    let streak = 0;
    for (const t of [...settled].sort((a, b) => +new Date(b.date) - +new Date(a.date))) {
      if (t.result === 'won') streak++;
      else break;
    }

    const byCreator = state.creators
      .map(c => {
        const picks = settled.filter(t => t.creatorId === c.id);
        const w = picks.filter(t => t.result === 'won').length;
        const units = state.tracked.filter(t => t.creatorId === c.id).reduce((sum, t) => sum + unitsFor(t), 0);
        return { creator: c, picks: picks.length, wins: w, winRate: picks.length ? Math.round((w / picks.length) * 100) : 0, units: +units.toFixed(2) };
      })
      .filter(x => x.picks > 0)
      .sort((a, b) => b.units - a.units);

    const monthlySpend = state.subscribedCreatorIds.reduce((sum, id) => {
      const c = state.creators.find(x => x.id === id);
      return sum + (c?.price ?? 0);
    }, 0);

    const visiblePosts = state.posts.filter(p => !p.isPremium || state.subscribedCreatorIds.includes(p.creatorId));

    return {
      totalPicks: state.tracked.length,
      settledPicks: settled.length,
      wins,
      losses: settled.length - wins,
      pending: state.tracked.filter(t => t.result === 'pending').length,
      winRate: settled.length ? Math.round((wins / settled.length) * 100) : 0,
      unitsNet: +unitsNet.toFixed(2),
      roi: staked ? +((unitsNet / staked) * 100).toFixed(1) : 0,
      streak,
      byCreator,
      bestCreator: byCreator[0] ?? null,
      activeSubs: state.subscribedCreatorIds.length,
      monthlySpend: +monthlySpend.toFixed(2),
      savedCount: state.savedPostIds.length,
      unread: state.notifications.filter(n => !n.read).length,
      availablePosts: visiblePosts.length,
      lockedPosts: state.posts.length - visiblePosts.length,
    };
  }, [state]);

  return {
    state,
    metrics,
    creatorById,
    isSubscribed,
    subscribe,
    unsubscribe,
    toggleBookmark,
    toggleSave,
    toggleLike,
    trackPick,
    setTrackedResult,
    removeTracked,
    markNotificationRead,
    markAllRead,
    updateSettings,
    reset,
  };
}

export type DemoMemberStore = ReturnType<typeof useDemoMemberStoreState>;

const DemoMemberContext = createContext<DemoMemberStore | null>(null);

/** Single shared session store for every Member demo tab (sidebar included). */
export function DemoMemberProvider({ children }: { children: ReactNode }) {
  const store = useDemoMemberStoreState();
  return <DemoMemberContext.Provider value={store}>{children}</DemoMemberContext.Provider>;
}

export function useDemoMemberStore(): DemoMemberStore {
  const ctx = useContext(DemoMemberContext);
  if (!ctx) throw new Error('useDemoMemberStore must be used inside <DemoMemberProvider>');
  return ctx;
}

/** Safe for shared components that render in both demo and live mode. */
export function useDemoMemberStoreOptional(): DemoMemberStore | null {
  return useContext(DemoMemberContext);
}
