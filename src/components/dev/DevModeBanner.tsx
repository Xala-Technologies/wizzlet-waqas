import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Palette, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const roles = [
  { label: 'Owner', role: 'admin' as const, path: '/admin', icon: Shield },
  { label: 'Creator', role: 'creator' as const, path: '/creator', icon: Palette },
  { label: 'Customer', role: 'subscriber' as const, path: '/dashboard', icon: User },
];

export function DevModeBanner() {
  const { devMode, role, setDevRole, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(false);

  if (!devMode || dismissed) return null;

  const handleSwitch = (r: typeof roles[number]) => {
    setDevRole(r.role);
    navigate(r.path);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive/95 backdrop-blur-sm text-destructive-foreground">
      <div className="container flex items-center justify-between h-10 gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-widest opacity-80">🧪 DEV MODE: FULL ACCESS</span>
          <div className="h-4 w-px bg-destructive-foreground/20" />
          <div className="flex items-center gap-1">
            {roles.map((r) => {
              const isActive = role === r.role;
              return (
                <button
                  key={r.role}
                  onClick={() => handleSwitch(r)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    isActive
                      ? 'bg-destructive-foreground/20 text-destructive-foreground'
                      : 'text-destructive-foreground/60 hover:text-destructive-foreground hover:bg-destructive-foreground/10'
                  }`}
                >
                  <r.icon className="h-3 w-3" />
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] text-destructive-foreground/70 hover:text-destructive-foreground hover:bg-destructive-foreground/10 px-2"
            onClick={() => { signOut(); navigate('/login'); }}
          >
            Exit Dev Mode
          </Button>
        </div>
      </div>
    </div>
  );
}
