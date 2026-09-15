import { ReactNode } from 'react';
import DemoRoleSwitcher from '@/components/demo/DemoRoleSwitcher';
import { MemberSidebar } from '@/components/dashboard/MemberSidebar';
import { MobileTopBar } from '@/components/dashboard/MobileTopBar';
import { DASHBOARD_CONTENT_CLASS } from '@/lib/dashboardSidebar';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function DemoMemberShell({ title, subtitle, actions, children }: Props) {
  return (
    <div className="h-dvh flex overflow-hidden bg-background">
      <MemberSidebar demo />
      <main className="flex-1 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto">
        <MobileTopBar homeHref="/demo/member">
          <MemberSidebar demo mobile />
        </MobileTopBar>
        <div className={cn('p-4 sm:p-6 md:p-8', DASHBOARD_CONTENT_CLASS)}>
          <DemoRoleSwitcher />
          <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
              {subtitle && <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>}
            </div>
            {actions}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export default DemoMemberShell;
