import { ReactNode } from 'react';
import DemoRoleSwitcher from '@/components/demo/DemoRoleSwitcher';
import { MemberSidebar } from '@/components/dashboard/MemberSidebar';
import { MobileTopBar } from '@/components/dashboard/MobileTopBar';

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function DemoMemberShell({ title, subtitle, actions, children }: Props) {
  return (
    <div className="min-h-screen flex bg-background">
      <MemberSidebar demo />
      <main className="flex-1 min-w-0 overflow-auto">
        <MobileTopBar>
          <MemberSidebar demo mobile />
        </MobileTopBar>
        <div className="p-4 sm:p-6 md:p-8 w-full max-w-4xl">
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
