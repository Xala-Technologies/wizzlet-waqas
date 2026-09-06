import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { WizzletLogo } from '@/components/WizzletLogo';

interface MobileTopBarProps {
  /** Sidebar rendered inside the slide-over drawer. */
  children: ReactNode;
  /** Optional badge/label rendered to the right of the logo. */
  badge?: ReactNode;
  /** Optional page title shown in the center of the bar. */
  title?: string;
}

/** Sticky mobile header with a slide-over navigation drawer (hidden from md up). */
export function MobileTopBar({ children, badge, title }: MobileTopBarProps) {
  const [open, setOpen] = useState(false);
  const { pathname, search } = useLocation();

  // Close the drawer whenever the route changes.
  useEffect(() => setOpen(false), [pathname, search]);

  return (
    <div className="md:hidden sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-card/95 px-4 py-2.5 backdrop-blur pt-[max(0.625rem,env(safe-area-inset-top))]">
      <WizzletLogo size="sm" />
      {title ? (
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{title}</p>
      ) : (
        <div className="flex-1" />
      )}
      {badge && <div className="shrink-0">{badge}</div>}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label="Open navigation menu"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent
          side="right"
          className="flex w-[min(100%,280px)] flex-col p-0 pb-[env(safe-area-inset-bottom)] [&>button]:right-2 [&>button]:top-2 [&>button]:inline-flex [&>button]:h-11 [&>button]:w-11 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-lg [&>button]:opacity-100"
        >
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-12">{children}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
