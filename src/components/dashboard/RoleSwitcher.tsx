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
import { cn } from '@/lib/utils';

function workspaceRoles(roles: AppRole[]): AppRole[] {
  return roles.filter(isAppRole);
}

type Tone = 'light' | 'dark';

function triggerClass(tone: Tone) {
  return cn(
    'flex w-full items-center gap-2.5 rounded-[var(--radius-md)] border px-3.5 py-2.5 text-left text-sm transition-colors duration-150',
    tone === 'dark'
      ? 'border-[#214250] bg-white/[0.06] text-[#F8FAFC] hover:bg-white/[0.08]'
      : 'border-border bg-background text-foreground hover:bg-muted/60',
  );
}

function mutedClass(tone: Tone) {
  return tone === 'dark' ? 'text-[#8197A3]' : 'text-muted-foreground';
}

/**
 * Workspace switcher — only when the account already holds multiple roles.
 * Never invents or assigns Creator/Member access from here.
 */
export function RoleSwitcher({ tone = 'light' }: { tone?: Tone } = {}) {
  const { role, roles, switchRole } = useAuth();
  const navigate = useNavigate();

  const held = workspaceRoles(roles);
  if (held.length < 2 || !role || !held.includes(role)) return null;

  const hasCreator = held.includes('creator');
  const hasMember = held.includes('subscriber');
  const activeIsWorkspace = role === 'creator' || role === 'subscriber';

  const goTo = (next: AppRole) => {
    if (next === role) return;
    if (!held.includes(next)) return;
    switchRole(next);
    navigate(homePathForRole(next));
  };

  if (hasCreator && hasMember && activeIsWorkspace) {
    const other = role === 'creator' ? 'subscriber' : 'creator';
    const alsoAdmin = held.includes('admin');

    return (
      <div className="space-y-1.5">
        <button type="button" onClick={() => goTo(other)} className={triggerClass(tone)}>
          <ArrowLeftRight className={cn('h-4 w-4 shrink-0', mutedClass(tone))} />
          <span className="min-w-0 flex-1 truncate">
            <span className={mutedClass(tone)}>Switch to </span>
            <span className="font-semibold">{ROLE_LABEL[other]}</span>
          </span>
        </button>
        {alsoAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(triggerClass(tone), 'justify-between')}>
              <span className="flex min-w-0 items-center gap-2">
                <span className={mutedClass(tone)}>Viewing as</span>
                <span className="truncate font-semibold">{ROLE_LABEL[role]}</span>
              </span>
              <ChevronsUpDown className={cn('h-4 w-4 shrink-0', mutedClass(tone))} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[210px]">
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(triggerClass(tone), 'justify-between')}>
        <span className="flex min-w-0 items-center gap-2">
          <span className={mutedClass(tone)}>Viewing as</span>
          <span className="truncate font-semibold">{ROLE_LABEL[role]}</span>
        </span>
        <ChevronsUpDown className={cn('h-4 w-4 shrink-0', mutedClass(tone))} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[210px]">
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
