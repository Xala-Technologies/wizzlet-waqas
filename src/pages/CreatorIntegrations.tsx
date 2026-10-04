import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAction, useMutation, useQuery } from 'convex/react';
import {
  BookOpen,
  Clock,
  Crown,
  LineChart,
  Loader2,
  Lock,
  MoreVertical,
  Plus,
  Shield,
  UserPlus,
  Hash,
  Volume2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CREATOR_DISCORD_DEMO,
  shouldUseCreatorDiscordDemo,
  type DemoDiscordProductMap,
} from '@/lib/creatorDiscordDemo';
import { cn } from '@/lib/utils';

function DiscordMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.1.1 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.1 16.1 0 0 0-4.8 0c-.14-.34-.37-.76-.54-1.09A.1.1 0 0 0 8.99 4c-1.5.26-2.93.71-4.27 1.33a.09.09 0 0 0-.04.03C2.43 9.07 1.8 12.7 2.12 16.28c0 .02 0 .04.02.05 1.8 1.32 3.53 2.12 5.24 2.65a.1.1 0 0 0 .12-.04c.4-.55.76-1.13 1.07-1.74a.1.1 0 0 0-.05-.13 10.7 10.7 0 0 1-1.52-.73.1.1 0 0 1-.02-.16c.1-.08.2-.16.3-.24a.1.1 0 0 1 .1-.01c3.19 1.46 6.64 1.46 9.8 0a.1.1 0 0 1 .11.01c.1.08.2.16.3.24a.1.1 0 0 1-.01.16c-.49.28-.99.52-1.53.73a.1.1 0 0 0-.05.13c.31.61.67 1.19 1.07 1.74a.1.1 0 0 0 .12.04c1.72-.53 3.45-1.33 5.25-2.65a.1.1 0 0 0 .02-.05c.38-4.14-.64-7.74-2.7-10.92a.07.07 0 0 0-.03-.03ZM8.52 14.33c-.96 0-1.75-.88-1.75-1.96s.77-1.96 1.75-1.96 1.77.88 1.75 1.96c0 1.08-.79 1.96-1.75 1.96Zm6.97 0c-.96 0-1.75-.88-1.75-1.96s.77-1.96 1.75-1.96 1.77.88 1.75 1.96c0 1.08-.78 1.96-1.75 1.96Z"
      />
    </svg>
  );
}

function money(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    cents / 100,
  );
}

function productIcon(name: string, fallback: DemoDiscordProductMap['icon']) {
  const n = name.toLowerCase();
  if (n.includes('crypto') || fallback === 'btc') return 'btc' as const;
  if (n.includes('all access') || n.includes('vip') || fallback === 'crown') return 'crown' as const;
  return 'chart' as const;
}

function ProductGlyph({ kind }: { kind: 'btc' | 'chart' | 'crown' }) {
  const wrap =
    kind === 'btc'
      ? 'bg-amber-100 text-amber-600'
      : kind === 'crown'
        ? 'bg-violet-100 text-violet-600'
        : 'bg-sky-100 text-sky-600';
  return (
    <span className={cn('flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold', wrap)}>
      {kind === 'btc' ? (
        '₿'
      ) : kind === 'crown' ? (
        <Crown className="h-4 w-4" />
      ) : (
        <LineChart className="h-4 w-4" />
      )}
    </span>
  );
}

function intToHex(color: number): string {
  if (!color) return '#94a3b8';
  return `#${color.toString(16).padStart(6, '0')}`;
}

const HOW_IT_WORKS = [
  {
    n: '1',
    title: 'Add the Sweeph bot',
    body: 'Invite the bot to your Discord server.',
  },
  {
    n: '2',
    title: 'Choose roles',
    body: 'Select which role belongs to each product.',
  },
  {
    n: '3',
    title: 'Subscribers get access',
    body: 'When a customer purchases, they automatically get the role.',
  },
  {
    n: '4',
    title: 'Automatic removal',
    body: 'When the subscription ends, the role is removed.',
  },
];

const CreatorIntegrations = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';
  const discordParam = searchParams.get('discord');

  const creator = useQuery(api.creators.queries.myCreator);
  const connection = useQuery(api.discord.queries.connection);
  const botStatus = useQuery(api.discord.queries.botStatus);
  const products = useQuery(
    api.products.mutations.listByCreator,
    creator?._id ? { creatorId: creator._id, activeOnly: true } : 'skip',
  );
  const startInstall = useMutation(api.discord.mutations.startBotInstall);
  const disconnect = useMutation(api.discord.mutations.disconnect);
  const setProductRole = useMutation(api.discord.mutations.setProductRole);
  const listRoles = useAction(api.discord.roles.listAssignableRoles);

  const [roles, setRoles] = useState<Array<{ id: string; name: string; color: number }>>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const liveConnected = connection?.connected === true;
  const useDemo = shouldUseCreatorDiscordDemo({
    forceDemo,
    disableDemo,
  });

  const loadRoles = useCallback(async () => {
    if (useDemo || !liveConnected) return;
    setRolesLoading(true);
    try {
      const next = await listRoles();
      setRoles(next);
      if (next.length === 0) {
        toast.message(
          'No assignable roles found. Move the Sweeph bot role above subscriber roles in Discord.',
        );
      }
    } catch {
      toast.error('Could not load Discord roles');
    } finally {
      setRolesLoading(false);
    }
  }, [listRoles, liveConnected, useDemo]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    if (discordParam === 'connected') toast.success('Discord server connected');
    if (discordParam === 'error') toast.error('Could not connect Discord. Try again.');
  }, [discordParam]);

  const mappedProducts: DemoDiscordProductMap[] = useDemo
    ? CREATOR_DISCORD_DEMO.products
    : (products ?? []).map((p) => {
        const role = roles.find((r) => r.id === p.discordRoleId);
        const mapped = Boolean(p.discordRoleId);
        return {
          id: p._id,
          name: p.name,
          priceLabel: `${money(p.priceCents)} / ${p.billingPeriod || 'month'}`,
          icon: productIcon(p.name, 'chart'),
          roleId: p.discordRoleId ?? '',
          roleName: p.discordRoleName ?? role?.name ?? '',
          roleColor: role ? intToHex(role.color) : '#94a3b8',
          status: mapped ? 'active' : 'unmapped',
        };
      });

  const guildName = useDemo
    ? CREATOR_DISCORD_DEMO.guildName
    : liveConnected
      ? connection.guildName
      : null;
  const memberCount = useDemo
    ? CREATOR_DISCORD_DEMO.memberCount
    : liveConnected
      ? connection.memberCount
      : null;
  const guildIconUrl = useDemo ? null : liveConnected ? connection.guildIconUrl : null;
  const connected = useDemo || liveConnected;
  const configured = botStatus?.configured ?? false;

  const roleOptions = useDemo ? CREATOR_DISCORD_DEMO.roles : roles;

  const onAddBot = async () => {
    if (useDemo) {
      toast.message('Sample preview — connect Discord on a live account');
      return;
    }
    if (!configured) {
      toast.error('Discord bot is not configured on this deployment');
      return;
    }
    setBusy(true);
    try {
      const { url } = await startInstall();
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start Discord install');
      setBusy(false);
    }
  };

  const onDisconnect = async () => {
    if (useDemo) {
      toast.message('Sample preview — Discord is not disconnected');
      return;
    }
    setBusy(true);
    try {
      await disconnect();
      toast.success('Discord disconnected');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Disconnect failed');
    } finally {
      setBusy(false);
    }
  };

  const onMapRole = async (productId: string, roleId: string) => {
    if (useDemo || productId.startsWith('demo-')) {
      toast.message('Sample preview — role mapping not saved');
      return;
    }
    const role = roles.find((r) => r.id === roleId);
    try {
      await setProductRole({
        productId: productId as Id<'products'>,
        roleId: roleId === 'none' ? null : roleId,
        roleName: roleId === 'none' ? null : role?.name ?? null,
      });
      toast.success(roleId === 'none' ? 'Role mapping cleared' : 'Role mapped');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save mapping');
    }
  };

  const loading =
    creator === undefined ||
    connection === undefined ||
    (creator !== null && products === undefined);

  const preview = CREATOR_DISCORD_DEMO.preview;

  return (
    <DashboardLayout type="creator" mainClassName="bg-clay-page">
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {useDemo ? (
            <div className="xl:col-span-12 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Sample preview for design review — not a live Discord server.{' '}
              <Link className="font-semibold underline" to="/creator/integrations?demo=0">
                Show empty live state
              </Link>
            </div>
          ) : null}

          <div className="xl:col-span-8 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="max-w-xl text-sm text-muted-foreground">
                Connect your Discord server and give subscribers automatic access.
              </p>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl"
                onClick={() =>
                  document.getElementById('discord-how-it-works')?.scrollIntoView({
                    behavior: 'smooth',
                  })
                }
              >
                <BookOpen className="mr-2 h-4 w-4" />
                View guide
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: UserPlus,
                  title: 'Automatic access',
                  body: 'Subscribers get the right role when they purchase.',
                },
                {
                  icon: Clock,
                  title: 'Auto removal',
                  body: 'Role is removed when subscription expires.',
                },
                {
                  icon: Shield,
                  title: 'Secure & flexible',
                  body: 'Choose which role belongs to each product.',
                },
              ].map((item) => (
                <div key={item.title} className="clay-card p-4 sm:p-5">
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-extrabold text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>

            <section className="clay-card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5865F2] text-white">
                    <DiscordMark className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="text-base font-extrabold text-foreground">
                      Connect your Discord server
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add our bot to your server and choose which roles to use.
                    </p>
                  </div>
                </div>
                {!connected ? (
                  <div className="flex flex-col items-end gap-1">
                    <Button
                      type="button"
                      className="h-10 rounded-xl bg-[#5865F2] hover:bg-[#4752c4]"
                      onClick={() => void onAddBot()}
                      disabled={busy}
                    >
                      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DiscordMark className="mr-2 h-4 w-4" />}
                      Add to Discord
                    </Button>
                    {!configured && !useDemo ? (
                      <p className="max-w-[220px] text-right text-xs text-muted-foreground">
                        Bot env (token, client id, secret) is not set on this deployment.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {connected && guildName ? (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3">
                  <div className="flex items-center gap-3">
                    {guildIconUrl ? (
                      <img
                        src={guildIconUrl}
                        alt=""
                        className="h-11 w-11 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
                        {useDemo ? CREATOR_DISCORD_DEMO.guildInitial : guildName.slice(0, 1)}
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-extrabold text-foreground">{guildName}</p>
                      <p className="text-xs text-muted-foreground">
                        {memberCount != null ? `${memberCount.toLocaleString()} members` : 'Connected'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Connected
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 rounded-xl" disabled={busy}>
                          Manage
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => void loadRoles()}>Refresh roles</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => void onDisconnect()}
                        >
                          Disconnect
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="clay-card overflow-hidden p-5 sm:p-6">
              <h2 className="text-base font-extrabold text-foreground">
                Product to Discord role mapping
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose which role subscribers should receive for each product.
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-semibold text-muted-foreground">
                      <th className="pb-3 font-semibold">Product</th>
                      <th className="pb-3 font-semibold">Discord role</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {mappedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          Create a product first, then map a Discord role.
                        </td>
                      </tr>
                    ) : (
                      mappedProducts.map((row) => (
                        <tr key={row.id} className="border-b border-border/70 last:border-0">
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-3">
                              <ProductGlyph kind={row.icon} />
                              <div>
                                <p className="font-bold text-foreground">{row.name}</p>
                                <p className="text-xs text-muted-foreground">{row.priceLabel}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-3">
                            <Select
                              value={row.roleId || 'none'}
                              onValueChange={(v) => void onMapRole(row.id, v)}
                              disabled={rolesLoading && !useDemo}
                            >
                              <SelectTrigger className="h-10 w-[200px] rounded-xl">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Discord access</SelectItem>
                                {roleOptions.map((r) => (
                                  <SelectItem key={r.id} value={r.id}>
                                    <span className="inline-flex items-center gap-2">
                                      <span
                                        className="h-2.5 w-2.5 rounded-full"
                                        style={{
                                          background:
                                            'color' in r && typeof r.color === 'number'
                                              ? intToHex(r.color)
                                              : (r as { color: string }).color,
                                        }}
                                      />
                                      {r.name}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 pr-3">
                            {row.status === 'active' ? (
                              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="text-sm font-medium text-muted-foreground">
                                Unmapped
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Row actions">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => void onMapRole(row.id, 'none')}>
                                  Clear mapping
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Button variant="ghost" className="mt-3 h-10 px-0 text-primary" asChild>
                <Link to="/creator/products">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add another product
                </Link>
              </Button>
            </section>
          </div>

          <aside className="xl:col-span-4 space-y-5">
            {connected && guildName ? (
              <div className="clay-card flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5865F2] text-white">
                    <DiscordMark className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Connected
                    </p>
                    <p className="text-sm font-extrabold text-foreground">{guildName}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 rounded-xl">
                      Manage
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => void onDisconnect()}>Disconnect</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : null}

            <section id="discord-how-it-works" className="clay-card p-5">
              <h2 className="text-base font-extrabold text-foreground">How it works</h2>
              <ol className="mt-4 space-y-4">
                {HOW_IT_WORKS.map((step) => (
                  <li key={step.n} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-extrabold text-violet-700">
                      {step.n}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">{step.title}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="clay-card p-5">
              <h2 className="text-base font-extrabold text-foreground">Discord server preview</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Example of how it looks for your subscribers.
              </p>
              <div className="mt-4 overflow-hidden rounded-2xl bg-[#1e1f22] text-white">
                <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
                  <DiscordMark className="h-4 w-4 text-[#5865F2]" />
                  <span className="text-xs font-bold">{preview.serverName}</span>
                </div>
                <div className="grid grid-cols-2 gap-0">
                  <div className="space-y-1 border-r border-white/10 p-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/40">
                      Vip channels
                    </p>
                    {preview.channels.map((ch) => (
                      <div
                        key={ch.id}
                        className="flex items-center gap-1.5 text-[11px] text-white/70"
                      >
                        {ch.locked ? (
                          <Lock className="h-3 w-3" />
                        ) : ch.kind === 'voice' ? (
                          <Volume2 className="h-3 w-3" />
                        ) : (
                          <Hash className="h-3 w-3" />
                        )}
                        {ch.name}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 p-3">
                    {preview.roles.map((r) => (
                      <div key={r.name}>
                        <p className="text-[10px] font-bold" style={{ color: r.color }}>
                          {r.name} — {r.count}
                        </p>
                      </div>
                    ))}
                    {preview.members.map((m) => (
                      <p key={m} className="text-[11px] text-white/60">
                        {m}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CreatorIntegrations;
