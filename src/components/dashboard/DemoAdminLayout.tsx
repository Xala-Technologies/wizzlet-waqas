import { Outlet } from 'react-router-dom';
import { DemoAdminSidebar } from '@/components/dashboard/DemoAdminSidebar';
import { MobileTopBar } from '@/components/dashboard/MobileTopBar';
import DemoRoleSwitcher from '@/components/demo/DemoRoleSwitcher';
import { DemoAdminProvider } from '@/components/demo/demoAdminStore';
import { DASHBOARD_CONTENT_CLASS, DASHBOARD_GUTTER_CLASS } from '@/lib/dashboardSidebar';
import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

export default function DemoAdminLayout() {
  return (
    <DemoAdminProvider>
      <div className="flex h-dvh max-h-dvh overflow-hidden bg-clay-page">
        <DemoAdminSidebar />
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain bg-clay-page">
          <MobileTopBar
            homeHref="/demo/admin"
            badge={
              <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--brand-50)] px-2 py-1 text-caption font-semibold text-[var(--brand-700)]">
                <Shield className="h-3 w-3" /> Admin
              </span>
            }
          >
            <DemoAdminSidebar mobile />
          </MobileTopBar>
          <div
            className={cn(
              'pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pt-5 md:pt-6 sm:pb-7 md:pb-9',
              DASHBOARD_GUTTER_CLASS,
              DASHBOARD_CONTENT_CLASS,
            )}
          >
            <DemoRoleSwitcher />
            <Outlet />
          </div>
        </main>
      </div>
    </DemoAdminProvider>
  );
}
