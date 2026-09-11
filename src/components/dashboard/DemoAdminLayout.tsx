import { Outlet } from 'react-router-dom';
import { DemoAdminSidebar } from '@/components/dashboard/DemoAdminSidebar';
import { MobileTopBar } from '@/components/dashboard/MobileTopBar';
import DemoRoleSwitcher from '@/components/demo/DemoRoleSwitcher';
import { DemoAdminProvider } from '@/components/demo/demoAdminStore';
import { Shield } from 'lucide-react';

export default function DemoAdminLayout() {
  return (
    <DemoAdminProvider>
      <div className="h-dvh flex overflow-hidden bg-background">
        <DemoAdminSidebar />
        <main className="flex-1 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto">
          <MobileTopBar
            homeHref="/demo/admin"
            badge={
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/10 px-2 py-1 text-caption font-medium text-destructive">
                <Shield className="h-3 w-3" /> Admin
              </span>
            }
          >
            <DemoAdminSidebar mobile />
          </MobileTopBar>
          <div className="p-4 sm:p-6 md:p-8 w-full max-w-6xl">
            <DemoRoleSwitcher />
            <Outlet />
          </div>
        </main>
      </div>
    </DemoAdminProvider>
  );
}
