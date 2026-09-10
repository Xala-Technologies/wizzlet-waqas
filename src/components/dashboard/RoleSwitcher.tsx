import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole, ROLE_LABEL, homePathForRole, isAppRole } from '@/lib/roles';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeftRight, Check, ChevronsUpDown } from 'lucide-react';

function workspaceRoles(roles: AppRole[]): AppRole[] {
  return roles.filter(isAppRole);
}

/**
 * Workspace switcher — only when the account already holds multiple roles.
 * Never invents or assigns Creator/Member access from here.
 */
export function RoleSwitcher() {
  const { role, roles, switchRole } = useAuth();
  const navigate = useNavigate();

  const held = workspaceRoles(roles);
  if (held.length < 2 || !role || !held.includes(role)) return null;

  const hasCreator = held.includes('creator');
  const hasMember = held.includes('subscriber');
  const activeIsWorkspace = role === 'creator' || role === 'subscriber';

  const goTo = (next: AppRole) => {
    if (next === role) return;
    // Only navigate into roles this account already holds.
    if (!held.includes(next)) return;
    switchRole(next);
    navigate(homePathForRole(next));
  };

  // Creator ↔ Member: compact one-tap control that matches the sidebar footer.
  if (hasCreator && hasMember && activeIsWorkspace) {
    const other = role === 'creator' ? 'subscriber' : 'creator';
    const alsoAdmin = held.includes('admin');

    return (
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => goTo(other)}
          className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-support text-foreground transition-colors hover:bg-muted/60"
        >
          <ArrowLeftRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">
            <span className="text-muted-foreground">Switch to </span>
            <span className="font-medium">{ROLE_LABEL[other]}</span>
          </span>
        </button>
        {alsoAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-support text-foreground transition-colors hover:bg-muted/60">
              <span className="flex min-w-0 items-center gap-2">
                <span className="text-muted-foreground">Viewing as</span>
                <span className="truncate font-medium">{ROLE_LABEL[role]}</span>
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[196px]">
              <DropdownMenuLabel className="text-caption font-normal text-muted-foreground">
                Switch workspace
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {held.map((r) => (
                <DropdownMenuItem key={r} onSelect={() => goTo(r)} className="text-ui">
                  <span className="flex-1">{ROLE_LABEL[r]}</span>
                  {r === role && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  // Admin + other held roles (no auto-grant).
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-support text-foreground transition-colors hover:bg-muted/60">
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-muted-foreground">Viewing as</span>
          <span className="truncate font-medium">{ROLE_LABEL[role]}</span>
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[196px]">
        <DropdownMenuLabel className="text-caption font-normal text-muted-foreground">
          Switch workspace
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {held.map((r) => (
          <DropdownMenuItem key={r} onSelect={() => goTo(r)} className="text-ui">
            <span className="flex-1">{ROLE_LABEL[r]}</span>
            {r === role && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
