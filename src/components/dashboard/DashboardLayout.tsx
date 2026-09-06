import { ReactNode } from 'react';
import { CreatorSidebar } from './CreatorSidebar';
import { AdminSidebar } from './AdminSidebar';
import { MemberSidebar } from './MemberSidebar';
import { MobileTopBar } from './MobileTopBar';

interface DashboardLayoutProps {
  children: ReactNode;
  type: 'creator' | 'member' | 'admin';
}

const CONTENT_WIDTH: Record<DashboardLayoutProps['type'], string> = {
  creator: 'max-w-5xl',
  admin: 'max-w-6xl',
  member: 'max-w-4xl',
};

export function DashboardLayout({ children, type }: DashboardLayoutProps) {
  const Sidebar = type === 'creator' ? CreatorSidebar : type === 'admin' ? AdminSidebar : MemberSidebar;

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto">
        <MobileTopBar>
          <Sidebar mobile />
        </MobileTopBar>
        <div
          className={`p-4 sm:p-6 md:p-8 w-full min-w-0 ${CONTENT_WIDTH[type]} pb-[max(1rem,env(safe-area-inset-bottom))]`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
