import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole, ROLE_LABEL, homePathForRole } from '@/lib/roles';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronsUpDown } from 'lucide-react';

/**
 * Only rendered for accounts that hold more than one role, so single-role users
 * never see a control they can't use.
 */
export function RoleSwitcher() {
  const { role, roles, switchRole } = useAuth();
  const navigate = useNavigate();

  if (roles.length < 2 || !role) return null;

  const handleSelect = (next: AppRole) => {
    if (next === role) return;
    switchRole(next);
    navigate(homePathForRole(next));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-foreground transition-colors hover:bg-muted/60">
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-muted-foreground">Viewing as</span>
          <span className="font-medium truncate">{ROLE_LABEL[role]}</span>
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[196px]">
        <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
          Switch workspace
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roles.map((r) => (
          <DropdownMenuItem key={r} onSelect={() => handleSelect(r)} className="text-[13px]">
            <span className="flex-1">{ROLE_LABEL[r]}</span>
            {r === role && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
