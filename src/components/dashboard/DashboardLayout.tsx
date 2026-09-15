import { ReactNode } from 'react';
import { CreatorSidebar } from './CreatorSidebar';
import { AdminSidebar } from './AdminSidebar';
import { MemberSidebar } from './MemberSidebar';
import { MobileTopBar } from './MobileTopBar';
import { AdminQueryBoundary } from './AdminQueryBoundary';
import { UnreadMessageWatcher } from './UnreadMessageWatcher';
import { DASHBOARD_CONTENT_CLASS } from '@/lib/dashboardSidebar';
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
    <div className="h-dvh flex overflow-hidden bg-background">
      <UnreadMessageWatcher />
      <Sidebar />
      <main className="flex-1 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto bg-background">
        <MobileTopBar homeHref={HOME_HREF[type]}>
          <Sidebar mobile />
        </MobileTopBar>
        <div
          className={cn(
            'p-4 sm:p-6 md:p-8 pb-[max(1rem,env(safe-area-inset-bottom))]',
            DASHBOARD_CONTENT_CLASS,
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );

  return type === 'admin' ? <AdminQueryBoundary>{body}</AdminQueryBoundary> : body;
}
