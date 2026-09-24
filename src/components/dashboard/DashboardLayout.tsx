import { ReactNode } from 'react';
import { CreatorSidebar } from './CreatorSidebar';
import { AdminSidebar } from './AdminSidebar';
import { MemberSidebar } from './MemberSidebar';
import { MobileTopBar } from './MobileTopBar';
import { CreatorTopBar } from './CreatorTopBar';
import { MemberTopBar } from './MemberTopBar';
import { AdminQueryBoundary } from './AdminQueryBoundary';
import { UnreadMessageWatcher } from './UnreadMessageWatcher';
import { DASHBOARD_CONTENT_CLASS, DASHBOARD_GUTTER_CLASS } from '@/lib/dashboardSidebar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  type: 'creator' | 'member' | 'admin';
}

const HOME_HREF: Record<DashboardLayoutProps['type'], string> = {
  creator: '/creator',
  admin: '/admin',
  member: '/dashboard',
};

export function DashboardLayout({ children, type }: DashboardLayoutProps) {
  const Sidebar = type === 'creator' ? CreatorSidebar : type === 'admin' ? AdminSidebar : MemberSidebar;

  const body = (
    <div className="flex h-dvh overflow-hidden bg-background">
      <UnreadMessageWatcher />
      <Sidebar />
      <main
        className={cn(
          'min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto',
          type === 'member' ? 'bg-[var(--bg-page)] dark:bg-background' : 'bg-muted/40',
        )}
      >
        <MobileTopBar homeHref={HOME_HREF[type]}>
          <Sidebar mobile />
        </MobileTopBar>
        {type === 'creator' ? <CreatorTopBar /> : null}
        {type === 'member' ? <MemberTopBar /> : null}
        <div
          className={cn(
            'py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:py-7 md:py-9',
            DASHBOARD_GUTTER_CLASS,
            DASHBOARD_CONTENT_CLASS,
            type === 'member' && 'bg-[var(--bg-page)] dark:bg-background',
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );

  return type === 'admin' ? <AdminQueryBoundary>{body}</AdminQueryBoundary> : body;
}
