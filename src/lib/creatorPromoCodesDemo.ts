/**
 * Sample Promo Codes management data for design review when the creator has no codes.
 * Aligned to the Prizelet Promo Codes mockup.
 */

const MOCK_NOW = Date.parse('2025-01-31T12:00:00.000Z');
const day = 86_400_000;
const daysAgo = (n: number) => MOCK_NOW - n * day;

export type DemoPromoStatus = 'active' | 'paused' | 'expired';

export type DemoPromoCodeRow = {
  id: string;
  code: string;
  discountPercent: number;
  appliesTo: string;
  uses: number;
  maxUses: number | null;
  revenueCents: number;
  conversionPct: number;
  status: DemoPromoStatus;
  createdAtMs: number;
};

export const CREATOR_PROMO_CODES_DEMO_METRICS = {
  activeCodes: 12,
  activeCodesDelta: 33,
  totalUses: 642,
  totalUsesDelta: 28,
  revenueCents: 432_000,
  revenueDelta: 41,
  conversionPct: 18.4,
  conversionDelta: 6,
} as const;

export const CREATOR_PROMO_CODES_DEMO_ROWS: DemoPromoCodeRow[] = [
  {
    id: 'demo-promo-1',
    code: 'LAKERS25',
    discountPercent: 25,
    appliesTo: 'All products',
    uses: 128,
    maxUses: null,
    revenueCents: 59_988,
    conversionPct: 22.4,
    status: 'active',
    createdAtMs: daysAgo(18),
  },
  {
    id: 'demo-promo-2',
    code: 'NBA50',
    discountPercent: 50,
    appliesTo: 'NBA Picks',
    uses: 86,
    maxUses: 100,
    revenueCents: 31_992,
    conversionPct: 19.1,
    status: 'active',
    createdAtMs: daysAgo(24),
  },
  {
    id: 'demo-promo-3',
    code: 'SUPERBOWL',
    discountPercent: 40,
    appliesTo: 'All products',
    uses: 53,
    maxUses: 50,
    revenueCents: 24_860,
    conversionPct: 14.8,
    status: 'active',
    createdAtMs: daysAgo(45),
  },
  {
    id: 'demo-promo-4',
    code: 'DISCORD25',
    discountPercent: 25,
    appliesTo: 'VIP Access',
    uses: 36,
    maxUses: null,
    revenueCents: 18_420,
    conversionPct: 12.2,
    status: 'paused',
    createdAtMs: daysAgo(32),
  },
  {
    id: 'demo-promo-5',
    code: 'WELCOME10',
    discountPercent: 10,
    appliesTo: 'All products',
    uses: 214,
    maxUses: null,
    revenueCents: 42_050,
    conversionPct: 26.8,
    status: 'active',
    createdAtMs: daysAgo(60),
  },
  {
    id: 'demo-promo-6',
    code: 'VIPFOREVER',
    discountPercent: 15,
    appliesTo: 'VIP Access',
    uses: 41,
    maxUses: null,
    revenueCents: 38_900,
    conversionPct: 16.5,
    status: 'active',
    createdAtMs: daysAgo(12),
  },
  {
    id: 'demo-promo-7',
    code: 'FLASH100',
    discountPercent: 100,
    appliesTo: 'Monthly Pass',
    uses: 12,
    maxUses: 20,
    revenueCents: 0,
    conversionPct: 8.0,
    status: 'expired',
    createdAtMs: daysAgo(90),
  },
  {
    id: 'demo-promo-8',
    code: 'TWITTER20',
    discountPercent: 20,
    appliesTo: 'All products',
    uses: 29,
    maxUses: null,
    revenueCents: 14_210,
    conversionPct: 11.4,
    status: 'active',
    createdAtMs: daysAgo(8),
  },
  {
    id: 'demo-promo-9',
    code: 'MLBOPEN',
    discountPercent: 30,
    appliesTo: 'MLB Picks',
    uses: 22,
    maxUses: 75,
    revenueCents: 9_880,
    conversionPct: 9.6,
    status: 'active',
    createdAtMs: daysAgo(40),
  },
  {
    id: 'demo-promo-10',
    code: 'REFER15',
    discountPercent: 15,
    appliesTo: 'All products',
    uses: 48,
    maxUses: null,
    revenueCents: 21_300,
    conversionPct: 15.2,
    status: 'active',
    createdAtMs: daysAgo(5),
  },
  {
    id: 'demo-promo-11',
    code: 'NEWYEAR25',
    discountPercent: 25,
    appliesTo: 'All products',
    uses: 67,
    maxUses: 200,
    revenueCents: 28_440,
    conversionPct: 17.9,
    status: 'active',
    createdAtMs: daysAgo(75),
  },
  {
    id: 'demo-promo-12',
    code: 'EARLYBIRD',
    discountPercent: 20,
    appliesTo: 'Premium Picks',
    uses: 55,
    maxUses: null,
    revenueCents: 33_120,
    conversionPct: 20.1,
    status: 'active',
    createdAtMs: daysAgo(3),
  },
  {
    id: 'demo-promo-13',
    code: 'IGSTORY15',
    discountPercent: 15,
    appliesTo: 'All products',
    uses: 38,
    maxUses: null,
    revenueCents: 16_800,
    conversionPct: 13.5,
    status: 'active',
    createdAtMs: daysAgo(2),
  },
  {
    id: 'demo-promo-14',
    code: 'YOUTUBE30',
    discountPercent: 30,
    appliesTo: 'Premium Picks',
    uses: 44,
    maxUses: 150,
    revenueCents: 27_600,
    conversionPct: 18.2,
    status: 'active',
    createdAtMs: daysAgo(1),
  },
];

export const CREATOR_PROMO_CODES_DEMO_TOP = [
  { rank: 1, code: 'WELCOME10', uses: 214, revenueCents: 42_050 },
  { rank: 2, code: 'LAKERS25', uses: 128, revenueCents: 59_988 },
  { rank: 3, code: 'NBA50', uses: 86, revenueCents: 31_992 },
  { rank: 4, code: 'EARLYBIRD', uses: 55, revenueCents: 33_120 },
  { rank: 5, code: 'REFER15', uses: 48, revenueCents: 21_300 },
] as const;

export const CREATOR_PROMO_CODES_TIPS = [
  'Promote codes on your social media bios and stories.',
  'Create limited-time offers to drive urgency.',
  'Pair a code with a tracking link to measure each channel.',
  'Use deeper discounts for VIP upgrades, lighter ones for first month.',
] as const;

export function shouldUseCreatorPromoCodesDemo(input: {
  promoCount: number;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (input.disableDemo) return false;
  if (input.forceDemo) return true;
  return input.promoCount === 0;
}

export function isCreatorPromoCodesDemoId(id: string): boolean {
  return id.startsWith('demo-promo-');
}
