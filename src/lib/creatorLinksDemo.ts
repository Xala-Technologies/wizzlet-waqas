/**
 * Sample Links data for design review when the creator has no tracking links yet.
 */

export type DemoCreatorLink = {
  id: string;
  name: string;
  url: string;
  clicks: number;
  conversions: number;
};

export const CREATOR_LINKS_DEMO_ROWS: DemoCreatorLink[] = [
  {
    id: 'demo-link-ig',
    name: 'Instagram Bio',
    url: 'https://prizelet.com/c/alexpicks',
    clicks: 1842,
    conversions: 96,
  },
  {
    id: 'demo-link-x',
    name: 'X / Twitter pin',
    url: 'https://prizelet.com/c/alexpicks',
    clicks: 721,
    conversions: 38,
  },
  {
    id: 'demo-link-discord',
    name: 'Discord welcome',
    url: 'https://prizelet.com/c/alexpicks?utm=discord',
    clicks: 412,
    conversions: 54,
  },
];

export function shouldUseCreatorLinksDemo(opts: {
  count: number;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (opts.disableDemo) return false;
  if (opts.forceDemo) return true;
  return opts.count === 0;
}

export function isCreatorLinksDemoId(id: string): boolean {
  return id.startsWith('demo-link-');
}
