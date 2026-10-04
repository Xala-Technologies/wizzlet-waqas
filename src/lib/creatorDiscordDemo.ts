/**
 * Sample Discord Integration screen for design review when the creator
 * has no connected guild, or ?demo=1.
 */

export type DemoDiscordRole = {
  id: string;
  name: string;
  color: string;
};

export type DemoDiscordProductMap = {
  id: string;
  name: string;
  priceLabel: string;
  icon: 'btc' | 'chart' | 'crown';
  roleId: string;
  roleName: string;
  roleColor: string;
  status: 'active' | 'unmapped';
};

export const CREATOR_DISCORD_DEMO = {
  guildName: 'BrodieBets Server',
  memberCount: 2341,
  guildInitial: 'B',
  roles: [
    { id: 'role-crypto', name: 'Crypto VIP', color: '#c084fc' },
    { id: 'role-premium', name: 'Premium Member', color: '#60a5fa' },
    { id: 'role-all', name: 'All Access', color: '#fbbf24' },
  ] as DemoDiscordRole[],
  products: [
    {
      id: 'demo-discord-crypto',
      name: 'Crypto Picks',
      priceLabel: '$29.99 / month',
      icon: 'btc',
      roleId: 'role-crypto',
      roleName: 'Crypto VIP',
      roleColor: '#c084fc',
      status: 'active',
    },
    {
      id: 'demo-discord-premium',
      name: 'Premium Picks',
      priceLabel: '$49.99 / month',
      icon: 'chart',
      roleId: 'role-premium',
      roleName: 'Premium Member',
      roleColor: '#60a5fa',
      status: 'active',
    },
    {
      id: 'demo-discord-all',
      name: 'All Access',
      priceLabel: '$99.99 / month',
      icon: 'crown',
      roleId: 'role-all',
      roleName: 'All Access',
      roleColor: '#fbbf24',
      status: 'active',
    },
  ] as DemoDiscordProductMap[],
  preview: {
    serverName: 'BrodieBets',
    channels: [
      { id: 'welcome', kind: 'text' as const, name: 'welcome', locked: false },
      { id: 'crypto', kind: 'text' as const, name: 'crypto-vip', locked: true },
      { id: 'premium', kind: 'text' as const, name: 'premium-picks', locked: true },
      { id: 'all', kind: 'text' as const, name: 'all-access', locked: true },
      { id: 'general', kind: 'voice' as const, name: 'general', locked: false },
    ],
    roles: [
      { name: 'CRYPTO VIP', count: 124, color: '#c084fc' },
      { name: 'PREMIUM MEMBER', count: 89, color: '#60a5fa' },
      { name: 'ALL ACCESS', count: 52, color: '#fbbf24' },
    ],
    members: ['User#1234', 'User#5678', 'User#9012'],
  },
};

export function shouldUseCreatorDiscordDemo(opts: {
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (opts.disableDemo) return false;
  return opts.forceDemo;
}
