import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Session-persisted data layer for the Owner/Admin demo.
 * Mirrors the real platform logic — intro vs standard fee tiers, per-creator
 * fee attribution, refunds, creator approval — without touching the database.
 */

export interface DemoAdminCreator {
  id: string;
  name: string;
  username: string;
  email: string;
  subs: number;
  joinedDaysAgo: number;
  active: boolean;
  featured: boolean;
}

export interface DemoAdminApplication {
  id: string;
  name: string;
  username: string;
  email: string;
  pitch: string;
  appliedDaysAgo: number;
}

export interface DemoAdminUser {
  id: string;
  name: string;
  email: string;
  role: 'subscriber' | 'creator' | 'admin';
  subs: number;
  joinedDaysAgo: number;
  active: boolean;
}

export type DemoTxStatus = 'active' | 'cancelled' | 'refunded';

export interface DemoAdminTransaction {
  id: string;
  daysAgo: number;
  customer: string;
  creatorId: string;
  amount: number;
  status: DemoTxStatus;
}

export interface DemoAdminSettings {
  platformName: string;
  supportEmail: string;
  tagline: string;
  standardFeePercent: number;
  introFeePercent: number;
  introPeriodDays: number;
  minPayoutAmount: number;
  payoutSchedule: 'weekly' | 'biweekly' | 'monthly';
  autoApproveCreators: boolean;
  creatorMessagingEnabled: boolean;
  growthManagerEnabled: boolean;
}

export interface DemoAdminState {
  creators: DemoAdminCreator[];
  applications: DemoAdminApplication[];
  users: DemoAdminUser[];
  transactions: DemoAdminTransaction[];
  settings: DemoAdminSettings;
}

const KEY = 'wizzlet.demo.admin.v1';

const CREATOR_SEED: DemoAdminCreator[] = [
  { id: 'c1', name: 'SharpShooter Picks', username: 'sharpshooter', email: 'sharp@email.com', subs: 342, joinedDaysAgo: 120, active: true, featured: true },
  { id: 'c2', name: 'ProPlays Daily', username: 'proplays', email: 'pro@email.com', subs: 218, joinedDaysAgo: 90, active: true, featured: false },
  { id: 'c3', name: 'ClutchKing Analytics', username: 'clutchking', email: 'clutch@email.com', subs: 156, joinedDaysAgo: 15, active: true, featured: false },
  { id: 'c4', name: 'BetWizard Pro', username: 'betwizard', email: 'wizard@email.com', subs: 89, joinedDaysAgo: 60, active: true, featured: false },
  { id: 'c5', name: 'PickMaster Elite', username: 'pickmaster', email: 'pick@email.com', subs: 203, joinedDaysAgo: 200, active: false, featured: false },
];

const CUSTOMERS = ['Alex Johnson', 'Maria Garcia', 'James Wilson', 'Sarah Chen', 'Mike Taylor', 'Emily Davis', 'Chris Brown', 'Nina Patel', 'Tom Baker', 'Sofia Marchetti'];
const PRICES = [14.99, 9.99, 19.99, 12.99, 24.99, 29.0, 7.99];

/** Deterministic seeded transactions spread over the last ~6 months. */
const txSeed = (): DemoAdminTransaction[] => {
  const out: DemoAdminTransaction[] = [];
  for (let i = 0; i < 72; i++) {
    const creator = CREATOR_SEED[i % CREATOR_SEED.length];
    const status: DemoTxStatus = i % 13 === 0 ? 'cancelled' : 'active';
    out.push({
      id: `t${i + 1}`,
      daysAgo: Math.round((i * 175) / 72),
      customer: CUSTOMERS[i % CUSTOMERS.length],
      creatorId: creator.id,
      amount: PRICES[i % PRICES.length],
      status,
    });
  }
  return out.sort((a, b) => a.daysAgo - b.daysAgo);
};

const seed = (): DemoAdminState => ({
  creators: CREATOR_SEED.map(c => ({ ...c })),
  applications: [
    { id: 'a1', name: 'Gridiron Genius', username: 'gridiron', email: 'gridiron@email.com', pitch: 'NFL spreads & totals, 3 seasons of tracked ROI.', appliedDaysAgo: 1 },
    { id: 'a2', name: 'Hoops Edge', username: 'hoopsedge', email: 'hoops@email.com', pitch: 'NBA player props modelled on pace and usage.', appliedDaysAgo: 3 },
  ],
  users: [
    { id: 'u1', name: 'Alex Johnson', email: 'alex@email.com', role: 'subscriber', subs: 3, joinedDaysAgo: 45, active: true },
    { id: 'u2', name: 'Maria Garcia', email: 'maria@email.com', role: 'subscriber', subs: 2, joinedDaysAgo: 30, active: true },
    { id: 'u3', name: 'James Wilson', email: 'james@email.com', role: 'creator', subs: 0, joinedDaysAgo: 120, active: true },
    { id: 'u4', name: 'Sarah Chen', email: 'sarah@email.com', role: 'subscriber', subs: 1, joinedDaysAgo: 10, active: true },
    { id: 'u5', name: 'Mike Taylor', email: 'mike@email.com', role: 'admin', subs: 0, joinedDaysAgo: 200, active: true },
    { id: 'u6', name: 'Emily Davis', email: 'emily@email.com', role: 'subscriber', subs: 4, joinedDaysAgo: 60, active: true },
    { id: 'u7', name: 'Chris Brown', email: 'chris@email.com', role: 'creator', subs: 0, joinedDaysAgo: 90, active: true },
  ],
  transactions: txSeed(),
  settings: {
    platformName: 'Wizzlet',
    supportEmail: 'support@wizzlet.com',
    tagline: 'The premium creator platform',
    standardFeePercent: 10,
    introFeePercent: 5,
    introPeriodDays: 30,
    minPayoutAmount: 50,
    payoutSchedule: 'weekly',
    autoApproveCreators: false,
    creatorMessagingEnabled: true,
    growthManagerEnabled: true,
  },
});

function useDemoAdminStoreState() {
  const [state, setState] = useState<DemoAdminState>(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DemoAdminState;
        // Forward-compat: backfill settings fields added after this session was persisted.
        return { ...parsed, settings: { ...seed().settings, ...parsed.settings } };
      }
    } catch { /* ignore */ }
    return seed();
  });

  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const reset = useCallback(() => setState(seed()), []);

  const creatorById = useCallback(
    (id: string) => state.creators.find(c => c.id === id),
    [state.creators],
  );

  /** Fee tier at the time the transaction was billed (intro window vs standard). */
  const feePercentFor = useCallback(
    (creator: DemoAdminCreator | undefined, tx?: DemoAdminTransaction) => {
      if (!creator) return state.settings.standardFeePercent;
      const ageAtBilling = creator.joinedDaysAgo - (tx?.daysAgo ?? 0);
      return ageAtBilling < state.settings.introPeriodDays
        ? state.settings.introFeePercent
        : state.settings.standardFeePercent;
    },
    [state.settings],
  );

  const toggleCreatorActive = useCallback((id: string) => {
    setState(s => ({ ...s, creators: s.creators.map(c => (c.id === id ? { ...c, active: !c.active } : c)) }));
  }, []);

  const toggleCreatorFeatured = useCallback((id: string) => {
    setState(s => ({ ...s, creators: s.creators.map(c => (c.id === id ? { ...c, featured: !c.featured } : c)) }));
  }, []);

  const approveApplication = useCallback((id: string) => {
    setState(s => {
      const app = s.applications.find(a => a.id === id);
      if (!app) return s;
      return {
        ...s,
        applications: s.applications.filter(a => a.id !== id),
        creators: [
          ...s.creators,
          { id: `c${Date.now()}`, name: app.name, username: app.username, email: app.email, subs: 0, joinedDaysAgo: 0, active: true, featured: false },
        ],
        users: [
          ...s.users,
          { id: `u${Date.now()}`, name: app.name, email: app.email, role: 'creator', subs: 0, joinedDaysAgo: 0, active: true },
        ],
      };
    });
  }, []);

  const rejectApplication = useCallback((id: string) => {
    setState(s => ({ ...s, applications: s.applications.filter(a => a.id !== id) }));
  }, []);

  const toggleUserActive = useCallback((id: string) => {
    setState(s => ({ ...s, users: s.users.map(u => (u.id === id ? { ...u, active: !u.active } : u)) }));
  }, []);

  const setTransactionStatus = useCallback((id: string, status: DemoTxStatus) => {
    setState(s => ({ ...s, transactions: s.transactions.map(t => (t.id === id ? { ...t, status } : t)) }));
  }, []);

  const updateSettings = useCallback((patch: Partial<DemoAdminSettings>) => {
    setState(s => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const rows = useMemo(
    () =>
      state.transactions.map(t => {
        const creator = state.creators.find(c => c.id === t.creatorId);
        const feePercent = feePercentFor(creator, t);
        const billable = t.status === 'refunded' ? 0 : t.amount;
        const fee = +(billable * (feePercent / 100)).toFixed(2);
        return {
          ...t,
          creatorName: creator?.name ?? 'Unknown',
          feePercent,
          fee,
          earnings: +(billable - fee).toFixed(2),
          date: new Date(Date.now() - t.daysAgo * 86400000),
        };
      }),
    [state.transactions, state.creators, feePercentFor],
  );

  const metrics = useMemo(() => {
    const counted = rows.filter(r => r.status !== 'refunded');
    const active = rows.filter(r => r.status === 'active');
    const volume = counted.reduce((s, r) => s + r.amount, 0);
    const fees = counted.reduce((s, r) => s + r.fee, 0);
    const payouts = counted.reduce((s, r) => s + r.earnings, 0);
    const refunded = rows.filter(r => r.status === 'refunded').reduce((s, r) => s + r.amount, 0);

    const months: { month: string; revenue: number; fees: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      const label = d.toLocaleString('en-US', { month: 'short' });
      const inMonth = counted.filter(r => r.date.getMonth() === d.getMonth() && r.date.getFullYear() === d.getFullYear());
      months.push({
        month: label,
        revenue: +inMonth.reduce((s, r) => s + r.amount, 0).toFixed(2),
        fees: +inMonth.reduce((s, r) => s + r.fee, 0).toFixed(2),
      });
    }

    const byCreator = state.creators
      .map(c => {
        const crows = counted.filter(r => r.creatorId === c.id);
        return {
          creator: c,
          volume: +crows.reduce((s, r) => s + r.amount, 0).toFixed(2),
          fees: +crows.reduce((s, r) => s + r.fee, 0).toFixed(2),
          transactions: crows.length,
          feePercent: feePercentFor(c),
        };
      })
      .sort((a, b) => b.fees - a.fees);

    const activeCreators = state.creators.filter(c => c.active).length;

    return {
      volume: +volume.toFixed(2),
      fees: +fees.toFixed(2),
      payouts: +payouts.toFixed(2),
      refunded: +refunded.toFixed(2),
      activeTransactions: active.length,
      totalTransactions: rows.length,
      totalCreators: state.creators.length,
      activeCreators,
      pendingApplications: state.applications.length,
      totalUsers: state.users.length,
      activeUsers: state.users.filter(u => u.active).length,
      subscribers: state.creators.reduce((s, c) => s + c.subs, 0),
      avgRevenuePerCreator: activeCreators ? +(volume / activeCreators).toFixed(2) : 0,
      effectiveFeeRate: volume ? +((fees / volume) * 100).toFixed(1) : 0,
      months,
      byCreator,
    };
  }, [rows, state.creators, state.applications.length, state.users, feePercentFor]);

  return {
    state,
    rows,
    metrics,
    creatorById,
    feePercentFor,
    toggleCreatorActive,
    toggleCreatorFeatured,
    approveApplication,
    rejectApplication,
    toggleUserActive,
    setTransactionStatus,
    updateSettings,
    reset,
  };
}

export type DemoAdminStore = ReturnType<typeof useDemoAdminStoreState>;

const DemoAdminContext = createContext<DemoAdminStore | null>(null);

/** Single shared session store for every Owner/Admin demo tab. */
export function DemoAdminProvider({ children }: { children: ReactNode }) {
  const store = useDemoAdminStoreState();
  return <DemoAdminContext.Provider value={store}>{children}</DemoAdminContext.Provider>;
}

export function useDemoAdminStore(): DemoAdminStore {
  const ctx = useContext(DemoAdminContext);
  if (!ctx) throw new Error('useDemoAdminStore must be used inside <DemoAdminProvider>');
  return ctx;
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
