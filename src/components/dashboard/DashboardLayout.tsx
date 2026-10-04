import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CreatorSidebar } from './CreatorSidebar';
import { AdminSidebar } from './AdminSidebar';
import { MemberSidebar } from './MemberSidebar';
import { MobileTopBar } from './MobileTopBar';
import { CreatorTopBar } from './CreatorTopBar';
import { MemberTopBar } from './MemberTopBar';
import { AdminTopBar } from './AdminTopBar';
import { AdminQueryBoundary } from './AdminQueryBoundary';
import { UnreadMessageWatcher } from './UnreadMessageWatcher';
import { SupportChatWidget } from './SupportChatWidget';
import { SupportChatProvider } from '@/contexts/SupportChatContext';
import { DASHBOARD_CONTENT_CLASS, DASHBOARD_GUTTER_CLASS } from '@/lib/dashboardSidebar';
import { dashboardPageTitle } from '@/lib/dashboardPageTitle';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  type: 'creator' | 'member' | 'admin';
  /** Optional main canvas class (e.g. Overview clay page bg). */
  mainClassName?: string;
}

const HOME_HREF: Record<DashboardLayoutProps['type'], string> = {
  creator: '/creator',
  admin: '/admin',
  member: '/dashboard',
};

/** Keep the document from scrolling so only <main> owns the vertical scrollbar. */
function useLockDocumentScroll() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverscroll = html.style.overscrollBehavior;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      html.style.overscrollBehavior = prevHtmlOverscroll;
    };
  }, []);
}

export function DashboardLayout({ children, type, mainClassName }: DashboardLayoutProps) {
  useLockDocumentScroll();
  const location = useLocation();
  const pageTitle = dashboardPageTitle(type, location);
  const Sidebar = type === 'creator' ? CreatorSidebar : type === 'admin' ? AdminSidebar : MemberSidebar;

  const body = (
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-clay-page">
      <UnreadMessageWatcher />
      <Sidebar />
      <main
        className={cn(
          'min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain bg-clay-page',
          mainClassName,
        )}
      >
        <MobileTopBar homeHref={HOME_HREF[type]} title={pageTitle}>
          <Sidebar mobile />
        </MobileTopBar>
        {type === 'creator' ? <CreatorTopBar /> : null}
        {type === 'member' ? <MemberTopBar /> : null}
        {type === 'admin' ? <AdminTopBar /> : null}
        <div
          className={cn(
            'pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pt-5 md:pt-6 sm:pb-7 md:pb-9',
            DASHBOARD_GUTTER_CLASS,
            DASHBOARD_CONTENT_CLASS,
          )}
        >
          {children}
        </div>
      </main>
      {type === 'creator' || type === 'member' ? (
        <SupportChatWidget audience={type} />
      ) : null}
    </div>
  );

  const inner =
    type === 'admin' ? <AdminQueryBoundary>{body}</AdminQueryBoundary> : body;

  if (type === 'creator' || type === 'member') {
    return <SupportChatProvider>{inner}</SupportChatProvider>;
  }
  return inner;
}
