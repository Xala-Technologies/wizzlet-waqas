/**
 * Resolve the sticky top-bar / mobile page title from the current location.
 * Keeps creator, member, and admin chrome in sync with sidebar labels.
 */

export type DashboardAudience = 'creator' | 'member' | 'admin';

type Loc = { pathname: string; search?: string; hash?: string };

function pathOnly(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

function settingsTabLabel(tab: string | null): string {
  switch (tab) {
    case 'branding':
      return 'Branding';
    case 'team':
      return 'Team';
    case 'billing':
      return 'Billing';
    case 'integrations':
      return 'Integrations';
    case 'notifications':
      return 'Notifications';
    case 'security':
      return 'Security';
    case 'advanced':
      return 'Advanced';
    case 'general':
    case null:
      return 'Settings';
    default:
      return 'Settings';
  }
}

function creatorTitle(loc: Loc): string {
  const path = pathOnly(loc.pathname);
  const hash = loc.hash ?? '';
  const tab = new URLSearchParams(loc.search ?? '').get('tab');

  if (path === '/creator') return 'Overview';
  if (path.startsWith('/creator/posts')) return 'Posts';
  if (path.startsWith('/creator/products')) return 'Products';
  if (path.startsWith('/creator/subscribers')) return 'Subscribers';
  if (path.startsWith('/creator/performance-tracker')) return 'Performance';
  if (path.startsWith('/creator/messages')) return 'Messages';
  if (path.startsWith('/creator/promo/codes')) return 'Promo Codes';
  if (path === '/creator/promo') return 'Marketing';
  if (path.startsWith('/creator/links')) return 'Links';
  if (path.startsWith('/creator/referrals')) return 'Referrals';
  if (path.startsWith('/creator/payouts')) return 'Payouts';
  if (path.startsWith('/creator/transactions')) return 'Transactions';
  if (path.startsWith('/creator/resolution-case')) return 'Resolution Case';
  if (path.startsWith('/creator/earnings') && hash === '#tax-docs') return 'Tax Documents';
  if (path.startsWith('/creator/earnings')) return 'Finance';
  if (path.startsWith('/creator/settings')) return settingsTabLabel(tab);
  if (path.startsWith('/creator/integrations')) return 'Discord Integration';
  if (path.startsWith('/creator/personal-growth-manager')) return 'Growth Manager';
  if (path.startsWith('/creator/support')) return 'Support Center';
  if (path.startsWith('/creator/notifications')) return 'Notifications';
  if (path.startsWith('/creator/access-control')) return 'Access Control';
  if (path.startsWith('/creator/smart-pricing')) return 'Smart Pricing';
  return 'Creator';
}

function memberTitle(loc: Loc): string {
  const path = pathOnly(loc.pathname);
  const base = path.startsWith('/demo/member') ? '/demo/member' : '/dashboard';
  const rest = path === base ? '' : path.slice(base.length);

  if (!rest || rest === '/') return 'Home';
  if (rest.startsWith('/discover')) return 'Discover';
  if (rest.startsWith('/subscriptions-billing')) return 'My Creators';
  if (rest.startsWith('/manage-subscription')) return 'Manage Subscription';
  if (rest.startsWith('/messages')) return 'Messages';
  if (rest.startsWith('/settings')) return 'Settings';
  if (rest.startsWith('/saved')) return 'Saved';
  if (rest.startsWith('/activity')) return 'Activity';
  if (rest.startsWith('/results')) return 'My Bet Tracker';
  if (rest.startsWith('/notifications')) return 'Notifications';
  return 'Member';
}

function adminTitle(loc: Loc): string {
  const path = pathOnly(loc.pathname);
  if (path === '/admin') return 'Overview';
  if (path.startsWith('/admin/creators')) return 'Creators';
  if (path.startsWith('/admin/customers')) return 'Customers';
  if (path.startsWith('/admin/users')) return 'All Accounts';
  if (path.startsWith('/admin/finance')) return 'Finance';
  if (path.startsWith('/admin/transactions')) return 'Transactions';
  if (path.startsWith('/admin/fees')) return 'Platform Fees';
  if (path.startsWith('/admin/payouts')) return 'Payouts';
  if (path.startsWith('/admin/creator-messaging')) return 'Creator Messaging';
  if (path.startsWith('/admin/growth-manager-inbox')) return 'Growth Inbox';
  if (path.startsWith('/admin/customer-email')) return 'Announcements';
  if (path.startsWith('/admin/resolution-cases')) return 'Resolution Cases';
  if (path.startsWith('/admin/alerts')) return 'Alerts';
  if (path.startsWith('/admin/notifications')) return 'Notifications';
  if (path.startsWith('/admin/reports')) return 'Reports';
  if (path.startsWith('/admin/settings')) return 'Settings';
  return 'Admin';
}

export function dashboardPageTitle(audience: DashboardAudience, loc: Loc): string {
  if (audience === 'creator') return creatorTitle(loc);
  if (audience === 'member') return memberTitle(loc);
  return adminTitle(loc);
}
