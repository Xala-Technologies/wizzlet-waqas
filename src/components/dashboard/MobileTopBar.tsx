import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { WizzletLogo } from '@/components/WizzletLogo';

interface MobileTopBarProps {
  /** Sidebar rendered inside the slide-over drawer. */
  children: ReactNode;
  /** Optional badge/label rendered to the right of the logo. */
  badge?: ReactNode;
}

/** Sticky mobile header with a slide-over navigation drawer (hidden from md up). */
export function MobileTopBar({ children, badge }: MobileTopBarProps) {
  const [open, setOpen] = useState(false);
  const { pathname, search } = useLocation();

  // Close the drawer whenever the route changes.
  useEffect(() => setOpen(false), [pathname, search]);

  return (
    <div className="md:hidden sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
      <WizzletLogo size="sm" />
      <div className="flex-1" />
      {badge && <div>{badge}</div>}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label="Open navigation menu"
          className="-mr-1 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="right" className="w-[260px] p-0">
          {children}
        </SheetContent>
      </Sheet>
    </div>
  );
}
