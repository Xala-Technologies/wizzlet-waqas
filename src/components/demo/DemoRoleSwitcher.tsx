import { Link, useLocation } from 'react-router-dom';
import { Shield, Palette, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const roles = [
  { label: 'View as Owner', path: '/demo/admin', icon: Shield, description: 'Platform admin' },
  { label: 'View as Creator', path: '/demo/creator', icon: Palette, description: 'Content creator' },
  { label: 'View as Customer', path: '/demo/member', icon: User, description: 'Subscriber' },
];

const DemoRoleSwitcher = () => {
  const { pathname } = useLocation();

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm text-primary font-medium">👀 Demo Mode</p>
          <span className="text-xs text-muted-foreground hidden sm:inline">— switch roles to explore</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {roles.map((role) => {
            const isActive = pathname === role.path || pathname.startsWith(role.path + '/');
            return (
              <Link key={role.path} to={role.path}>
                <Button
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                >
                  <role.icon className="h-3 w-3" />
                  {role.label}
                </Button>
              </Link>
            );
          })}
          <Link to="/">
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5">
              <ArrowLeft className="h-3 w-3" /> Exit Demo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DemoRoleSwitcher;
