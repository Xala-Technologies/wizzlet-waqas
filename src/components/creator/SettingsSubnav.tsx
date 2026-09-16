import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'branding', label: 'Branding' },
  { id: 'team', label: 'Team' },
  { id: 'billing', label: 'Billing' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security' },
  { id: 'advanced', label: 'Advanced' },
] as const;

export type SettingsTabId = (typeof TABS)[number]['id'];

export function SettingsSubnav({ active }: { active?: SettingsTabId }) {
  const [params] = useSearchParams();
  const fromQuery = params.get('tab');
  const resolved: SettingsTabId =
    active ??
    (TABS.some((t) => t.id === fromQuery) ? (fromQuery as SettingsTabId) : 'general');

  return (
    <nav
      className="mb-6 flex gap-1 overflow-x-auto border-b border-border"
      aria-label="Settings sections"
    >
      {TABS.map((tab) => {
        const isActive = resolved === tab.id;
        const href =
          tab.id === 'general' ? '/creator/settings' : `/creator/settings?tab=${tab.id}`;
        return (
          <Link
            key={tab.id}
            to={href}
            className={cn(
              'shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors',
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function useSettingsTab(): SettingsTabId {
  const [params] = useSearchParams();
  const fromQuery = params.get('tab');
  if (TABS.some((t) => t.id === fromQuery)) return fromQuery as SettingsTabId;
  return 'general';
}
