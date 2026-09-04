import { americanToDecimal } from '@/lib/odds';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * In-memory (session-persisted) data layer for the Creator demo.
 * Mirrors the real creator dashboard logic — fee tiers, odds conversion,
 * pick settlement, subscriber revenue — without touching the database.
 */

export type PickResult = 'pending' | 'won' | 'lost' | 'push';

export interface DemoPost {
  id: string;
  title: string;
  content: string;
  sport: string;
  event: string;
  usOdds: string;
  units: number;
  isPremium: boolean;
  result: PickResult;
  createdAt: string;
  views: number;
  saves: number;
}

export interface DemoProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  billingPeriod: 'monthly' | 'quarterly' | 'yearly';
  isFeatured: boolean;
  isActive: boolean;
  maxSpots: number | null;
}

export interface DemoSubscriber {
  id: string;
  name: string;
  email: string;
  productId: string;
  amount: number;
  status: 'active' | 'cancelled';
  joinedAt: string;
}

export interface DemoPromo {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number | null;
  timesUsed: number;
  isActive: boolean;
}

export interface DemoMessage {
  id: string;
  from: 'creator' | 'subscriber';
  body: string;
  createdAt: string;
}

export interface DemoThread {
  id: string;
  subscriberId: string;
  unread: number;
  messages: DemoMessage[];
}

export interface DemoSettings {
  displayName: string;
  username: string;
  bio: string;
  monthlyPrice: number;
  messagingEnabled: boolean;
  notifyOnSubscribe: boolean;
  published: boolean;
}

export interface DemoState {
  posts: DemoPost[];
  products: DemoProduct[];
  subscribers: DemoSubscriber[];
  promos: DemoPromo[];
  threads: DemoThread[];
  settings: DemoSettings;
  joinedDaysAgo: number;
}

const day = 86400000;
const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * day).toISOString();

const INTRO_FEE = 0.05;
const STANDARD_FEE = 0.1;
const INTRO_DAYS = 30;

export const feeRateFor = (joinedDaysAgo: number) =>
  joinedDaysAgo < INTRO_DAYS ? INTRO_FEE : STANDARD_FEE;

export const introDaysLeft = (joinedDaysAgo: number) =>
  Math.max(0, INTRO_DAYS - joinedDaysAgo);

/** American odds -> decimal (EU) odds. */
export { americanToDecimal as usToDecimal } from '@/lib/odds';

/** Units won/lost for a settled pick at given odds. */
export const unitsFor = (post: DemoPost): number => {
  const dec = americanToDecimal(post.usOdds);
  if (!dec) return 0;
  if (post.result === 'won') return +((dec - 1) * post.units).toFixed(2);
  if (post.result === 'lost') return -post.units;
  return 0;
};

const FIRST = ['Marcus', 'Dana', 'Ivan', 'Sofia', 'Tom', 'Priya', 'Lucas', 'Nina', 'Omar', 'Chloe', 'Diego', 'Hana', 'Felix', 'Amara', 'Jonas', 'Mia', 'Ravi', 'Elena', 'Caleb', 'Yuki', 'Noah', 'Lea', 'Sam', 'Iris'];
const LAST = ['Reid', 'Whitfield', 'Petrov', 'Marchetti', 'Baker', 'Nair', 'Moreau', 'Sandberg', 'Haddad', 'Dubois', 'Alvarez', 'Sato', 'Braun', 'Okafor', 'Lind', 'Rossi', 'Kapoor', 'Costa', 'Turner', 'Tanaka', 'Bergman', 'Fontaine', 'Ellis', 'Novak'];

const TIER_MIX: { productId: string; amount: number; count: number }[] = [
  { productId: 'pr1', amount: 29, count: 14 },
  { productId: 'pr2', amount: 79, count: 6 },
  { productId: 'pr3', amount: 249, count: 4 },
];

function seedSubscribers(): DemoSubscriber[] {
  const out: DemoSubscriber[] = [];
  let i = 0;
  for (const tier of TIER_MIX) {
    for (let n = 0; n < tier.count; n++) {
      const first = FIRST[i % FIRST.length];
      const last = LAST[(i * 7) % LAST.length];
      // deterministic churn: every 8th member cancelled
      const cancelled = i % 8 === 7;
      out.push({
        id: `s${i + 1}`,
        name: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
        productId: tier.productId,
        amount: tier.amount,
        status: cancelled ? 'cancelled' : 'active',
        joinedAt: iso(2 + ((i * 5) % 88)),
      });
      i++;
    }
  }
  return out;
}

const seed = (): DemoState => ({
  joinedDaysAgo: 12,
  posts: [
    { id: 'p1', title: 'NFL Week 14: Top 3 player props to target', content: 'Mahomes over 1.5 passing TDs is the play — Chiefs are 8-1 to the over at home.', sport: 'NFL', event: 'Chiefs vs Bills', usOdds: '-110', units: 2, isPremium: true, result: 'won', createdAt: iso(1), views: 842, saves: 61 },
    { id: 'p2', title: 'Chiefs -3.5 is the cleanest number on the board', content: 'Line movement from -2.5 tells you where the sharp money went.', sport: 'NFL', event: 'Chiefs vs Raiders', usOdds: '-105', units: 3, isPremium: true, result: 'pending', createdAt: iso(2), views: 604, saves: 44 },
    { id: 'p3', title: 'Free pick: Lakers vs Celtics under 221.5', content: 'Both teams on a back-to-back — pace drops hard in these spots.', sport: 'NBA', event: 'Lakers vs Celtics', usOdds: '+100', units: 1, isPremium: false, result: 'lost', createdAt: iso(3), views: 1930, saves: 128 },
    { id: 'p4', title: 'MLB postseason strategy: fading public totals', content: 'Playoff bullpens change everything. Here is my full model breakdown.', sport: 'MLB', event: 'Series preview', usOdds: '-120', units: 2, isPremium: true, result: 'won', createdAt: iso(5), views: 517, saves: 39 },
  ],
  products: [
    { id: 'pr1', name: 'Core Access', description: 'All premium picks, posted daily.', price: 29, billingPeriod: 'monthly', isFeatured: true, isActive: true, maxSpots: null },
    { id: 'pr2', name: 'VIP Inner Circle', description: 'Core plus early releases and 1:1 messaging.', price: 79, billingPeriod: 'monthly', isFeatured: false, isActive: true, maxSpots: 50 },
    { id: 'pr3', name: 'Season Pass', description: 'Full season, billed once.', price: 249, billingPeriod: 'yearly', isFeatured: false, isActive: true, maxSpots: null },
  ],
  subscribers: seedSubscribers(),
  promos: [
    { id: 'c1', code: 'WELCOME20', discountPercent: 20, maxUses: 100, timesUsed: 37, isActive: true },
    { id: 'c2', code: 'PLAYOFFS10', discountPercent: 10, maxUses: null, timesUsed: 12, isActive: true },
  ],
  threads: [
    { id: 't1', subscriberId: 's1', unread: 1, messages: [
      { id: 'm1', from: 'subscriber', body: 'Are you posting the Chiefs play before kickoff?', createdAt: iso(0.2) },
    ] },
    { id: 't2', subscriberId: 's2', unread: 0, messages: [
      { id: 'm2', from: 'subscriber', body: 'Loved the props breakdown, thanks!', createdAt: iso(1) },
      { id: 'm3', from: 'creator', body: 'Appreciate it — more of those coming this week.', createdAt: iso(0.9) },
    ] },
  ],
  settings: {
    displayName: 'Demo Creator',
    username: 'democreator',
    bio: 'NFL & NBA handicapper. 3 years verified. Data-driven props and spreads.',
    monthlyPrice: 29,
    messagingEnabled: true,
    notifyOnSubscribe: true,
    published: true,
  },
});

export const defaultSettings = (): DemoSettings => seed().settings;

const KEY = 'wizzlet.demo.creator.v2';

export function useDemoCreatorStore() {
  const [state, setState] = useState<DemoState>(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) return JSON.parse(raw) as DemoState;
    } catch { /* ignore */ }
    return seed();
  });

  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const reset = useCallback(() => setState(seed()), []);

  const addPost = useCallback((post: Omit<DemoPost, 'id' | 'createdAt' | 'views' | 'saves' | 'result'>) => {
    setState(s => ({
      ...s,
      posts: [{ ...post, id: `p${Date.now()}`, createdAt: new Date().toISOString(), views: 0, saves: 0, result: 'pending' }, ...s.posts],
    }));
  }, []);

  const setPostResult = useCallback((id: string, result: PickResult) => {
    setState(s => ({ ...s, posts: s.posts.map(p => (p.id === id ? { ...p, result } : p)) }));
  }, []);

  const deletePost = useCallback((id: string) => {
    setState(s => ({ ...s, posts: s.posts.filter(p => p.id !== id) }));
  }, []);

  const addProduct = useCallback((product: Omit<DemoProduct, 'id'>) => {
    setState(s => ({ ...s, products: [...s.products, { ...product, id: `pr${Date.now()}` }] }));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setState(s => ({
      ...s,
      products: s.products.filter(p => p.id !== id),
      subscribers: s.subscribers.map(x => (x.productId === id ? { ...x, status: 'cancelled' as const } : x)),
    }));
  }, []);

  const updateProduct = useCallback((id: string, patch: Partial<DemoProduct>) => {
    setState(s => ({ ...s, products: s.products.map(p => (p.id === id ? { ...p, ...patch } : p)) }));
  }, []);

  const cancelSubscriber = useCallback((id: string) => {
    setState(s => ({ ...s, subscribers: s.subscribers.map(x => (x.id === id ? { ...x, status: 'cancelled' as const } : x)) }));
  }, []);

  const reactivateSubscriber = useCallback((id: string) => {
    setState(s => ({ ...s, subscribers: s.subscribers.map(x => (x.id === id ? { ...x, status: 'active' as const } : x)) }));
  }, []);

  const addPromo = useCallback((promo: Omit<DemoPromo, 'id' | 'timesUsed'>) => {
    setState(s => ({ ...s, promos: [...s.promos, { ...promo, id: `c${Date.now()}`, timesUsed: 0 }] }));
  }, []);

  const togglePromo = useCallback((id: string) => {
    setState(s => ({ ...s, promos: s.promos.map(p => (p.id === id ? { ...p, isActive: !p.isActive } : p)) }));
  }, []);

  const deletePromo = useCallback((id: string) => {
    setState(s => ({ ...s, promos: s.promos.filter(p => p.id !== id) }));
  }, []);

  const readThread = useCallback((id: string) => {
    setState(s => ({ ...s, threads: s.threads.map(t => (t.id === id ? { ...t, unread: 0 } : t)) }));
  }, []);

  const reply = useCallback((threadId: string, body: string) => {
    setState(s => ({
      ...s,
      threads: s.threads.map(t =>
        t.id === threadId
          ? { ...t, unread: 0, messages: [...t.messages, { id: `m${Date.now()}`, from: 'creator', body, createdAt: new Date().toISOString() }] }
          : t,
      ),
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<DemoSettings>) => {
    setState(s => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const metrics = useMemo(() => {
    const active = state.subscribers.filter(s => s.status === 'active');
    const mrr = active.reduce((sum, s) => {
      const product = state.products.find(p => p.id === s.productId);
      if (product?.billingPeriod === 'yearly') return sum + s.amount / 12;
      if (product?.billingPeriod === 'quarterly') return sum + s.amount / 3;
      return sum + s.amount;
    }, 0);
    const feeRate = feeRateFor(state.joinedDaysAgo);
    const platformFee = mrr * feeRate;
    const settled = state.posts.filter(p => p.result === 'won' || p.result === 'lost');
    const wins = settled.filter(p => p.result === 'won').length;
    const unitsNet = state.posts.reduce((sum, p) => sum + unitsFor(p), 0);
    const staked = settled.reduce((sum, p) => sum + p.units, 0);
    const productStats = state.products.map(p => {
      const subs = active.filter(x => x.productId === p.id);
      const gross = subs.reduce((sum, x) => sum + x.amount, 0);
      return {
        id: p.id,
        activeSubs: subs.length,
        gross: +gross.toFixed(2),
        fee: +(gross * feeRate).toFixed(2),
        net: +(gross * (1 - feeRate)).toFixed(2),
        spotsLeft: p.maxSpots === null ? null : Math.max(0, p.maxSpots - subs.length),
      };
    });

    return {
      productStats,
      activeSubscribers: active.length,
      churned: state.subscribers.length - active.length,
      mrr: +mrr.toFixed(2),
      feeRate,
      platformFee: +platformFee.toFixed(2),
      netEarnings: +(mrr - platformFee).toFixed(2),
      totalPosts: state.posts.length,
      premiumPosts: state.posts.filter(p => p.isPremium).length,
      settledPicks: settled.length,
      winRate: settled.length ? Math.round((wins / settled.length) * 100) : 0,
      unitsNet: +unitsNet.toFixed(2),
      roi: staked ? +((unitsNet / staked) * 100).toFixed(1) : 0,
      totalViews: state.posts.reduce((s, p) => s + p.views, 0),
      unreadMessages: state.threads.reduce((s, t) => s + t.unread, 0),
      introDaysLeft: introDaysLeft(state.joinedDaysAgo),
    };
  }, [state]);

  return {
    state,
    metrics,
    addPost,
    setPostResult,
    deletePost,
    addProduct,
    updateProduct,
    deleteProduct,
    cancelSubscriber,
    reactivateSubscriber,
    addPromo,
    togglePromo,
    deletePromo,
    readThread,
    reply,
    updateSettings,
    reset,
  };
}

export type DemoStore = ReturnType<typeof useDemoCreatorStore>;
