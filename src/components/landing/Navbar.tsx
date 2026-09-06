import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Menu, X, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { WizzletLogo } from '@/components/WizzletLogo';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Today\'s Events', path: '/todays-events' },
  { label: 'Network', path: '/network' },
  { label: 'Creators', path: '/creators' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, role } = useAuth();
  const { pathname } = useLocation();

  const dashboardPath = role === 'creator' ? '/creator' : role === 'admin' ? '/admin' : '/dashboard';
  const notificationsPath = role === 'creator' ? '/creator' : '/dashboard/notifications';

  return (
    <>
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
    >
      Skip to main content
    </a>
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/70 backdrop-blur-2xl">

      <div className="container flex h-16 items-center justify-between">
        {/* LEFT: Logo */}
        <WizzletLogo size="md" />

        {/* CENTER: Nav links */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map(({ label, path }) => {
            const isActive = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative px-3.5 py-2 text-[13px] font-medium rounded-lg transition-all duration-200',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>

        {/* RIGHT: Auth buttons + theme + notification bell */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <ThemeToggle />
          {user && (
            <Link to={notificationsPath} className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
            </Link>
          )}
          {user ? (
            <Link to={dashboardPath}>
              <Button variant="default" size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button variant="default" size="sm">Get Access</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex lg:hidden items-center gap-2">
          {user && (
            <Link
              to={notificationsPath}
              aria-label="Notifications"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-primary" />
            </Link>
          )}
          <ThemeToggle />
          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="landing-mobile-nav"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="landing-mobile-nav"
          role="navigation"
          aria-label="Mobile"
          className="lg:hidden border-t border-border bg-card/95 backdrop-blur-xl px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 space-y-1 animate-fade-in"
        >
          {navLinks.map(({ label, path }) => {
            const isActive = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center px-3 py-2.5 text-sm rounded-lg transition-colors',
                  isActive ? 'text-foreground bg-muted/50' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                )}
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            );
          })}
          <div className="flex flex-col gap-2 pt-3 border-t border-border mt-2">
            {user ? (
              <Link to={dashboardPath} onClick={() => setMobileOpen(false)}>
                <Button variant="default" size="sm" className="w-full justify-center min-h-11">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-center min-h-11">Log in</Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)}>
                  <Button variant="default" size="sm" className="w-full justify-center min-h-11">Get Access</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
    </>

  );
}
