/**
 * Sample Tax Documents data aligned to the Prizelet Earnings → Tax Documents mockup.
 */

export type DemoTaxDoc = {
  id: string;
  name: string;
  taxYear: number;
  type: string;
  issuedLabel: string;
  status: 'available' | 'pending';
};

export const CREATOR_TAX_DOCS_DEMO_YEAR = 2025;

export const CREATOR_TAX_DOCS_DEMO_METRICS = {
  documentsAvailable: 3,
  documentsDelta: 100,
  taxYear: 2025,
  taxYearRangeLabel: 'Jan 1, 2025 – Dec 31, 2025',
  taxFormOnFile: 'W-9',
  taxStatus: 'Verified' as const,
  addressLine: '123 Creator St',
  addressCity: 'Tallinn, Estonia',
} as const;

export const CREATOR_TAX_DOCS_DEMO_ROWS: DemoTaxDoc[] = [
  {
    id: 'demo-tax-1',
    name: '1099-K',
    taxYear: 2024,
    type: 'Payment Card and Third Party Network Transactions',
    issuedLabel: 'Jan 31, 2025',
    status: 'available',
  },
  {
    id: 'demo-tax-2',
    name: 'Annual Earnings Report',
    taxYear: 2024,
    type: 'Platform Statement',
    issuedLabel: 'Jan 31, 2025',
    status: 'available',
  },
  {
    id: 'demo-tax-3',
    name: '1099-K',
    taxYear: 2023,
    type: 'Payment Card and Third Party Network Transactions',
    issuedLabel: 'Jan 31, 2024',
    status: 'available',
  },
  {
    id: 'demo-tax-4',
    name: 'Annual Earnings Report',
    taxYear: 2023,
    type: 'Platform Statement',
    issuedLabel: 'Jan 31, 2024',
    status: 'available',
  },
  {
    id: 'demo-tax-5',
    name: '1099-K',
    taxYear: 2022,
    type: 'Payment Card and Third Party Network Transactions',
    issuedLabel: 'Jan 31, 2023',
    status: 'available',
  },
  {
    id: 'demo-tax-6',
    name: 'Annual Earnings Report',
    taxYear: 2022,
    type: 'Platform Statement',
    issuedLabel: 'Jan 31, 2023',
    status: 'available',
  },
];

export const CREATOR_TAX_SEASON_TIPS = [
  'Keep your tax information up to date',
  'Download your documents early',
  'Review earnings reports carefully',
  'Store copies securely for your records',
  'Consult a tax professional',
] as const;

export function isCreatorTaxDocsDemoId(id: string): boolean {
  return id.startsWith('demo-tax-');
}

export function shouldUseCreatorTaxDocsDemo(input: {
  forceDemo: boolean;
  disableDemo: boolean;
  /** Real documents from backend when available. */
  realDocCount: number;
}): boolean {
  if (input.disableDemo) return false;
  if (input.forceDemo) return true;
  return input.realDocCount === 0;
}
