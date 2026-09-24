import { ReactNode } from 'react';
import DemoRoleSwitcher from '@/components/demo/DemoRoleSwitcher';
import { MemberSidebar } from '@/components/dashboard/MemberSidebar';
import { MobileTopBar } from '@/components/dashboard/MobileTopBar';
import { DASHBOARD_CONTENT_CLASS, DASHBOARD_GUTTER_CLASS } from '@/lib/dashboardSidebar';
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
        <div className={cn('py-5 sm:py-7 md:py-9', DASHBOARD_GUTTER_CLASS, DASHBOARD_CONTENT_CLASS)}>
          <DemoRoleSwitcher />
          <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="type-page-title text-foreground">{title}</h1>
              {subtitle && <p className="mt-1.5 text-support text-muted-foreground">{subtitle}</p>}
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
