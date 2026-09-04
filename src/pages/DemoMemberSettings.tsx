import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RotateCcw, Save, User, Bell, Target } from 'lucide-react';
import DemoMemberShell from '@/components/demo/DemoMemberShell';
import { useDemoMemberStore } from '@/components/demo/demoMemberStore';

const DemoMemberSettings = () => {
  const store = useDemoMemberStore();
  const { settings } = store.state;
  const [form, setForm] = useState(settings);

  useEffect(() => { setForm(settings); }, [settings]);

  const dirty = JSON.stringify(form) !== JSON.stringify(settings);

  const save = () => {
    store.updateSettings(form);
    toast.success('Settings saved');
  };

  return (
    <DemoMemberShell
      title="Settings"
      subtitle="Manage your profile, notifications and tracking defaults"
      actions={
        <Button size="sm" className="text-xs" disabled={!dirty} onClick={save}>
          <Save className="mr-1.5 h-3.5 w-3.5" /> Save changes
        </Button>
      }
    >
      <div className="space-y-4">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Profile</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="msg-display-name" className="text-xs">Display name</Label>
<Input id="msg-display-name" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="msg-username" className="text-xs">Username</Label>
<Input id="msg-username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="msg-email" className="text-xs">Email</Label>
<Input id="msg-email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1" />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Notifications</h2>
          <div className="space-y-3">
            {([
              { key: 'emailOnNewPost' as const, label: 'New posts from creators I follow', desc: 'Get notified the moment a pick drops' },
              { key: 'emailOnPromo' as const, label: 'Promos and discounts', desc: 'Offers from creators you follow' },
              { key: 'productUpdates' as const, label: 'Product updates', desc: 'Platform news and new features' },
            ]).map(row => (
              <div key={row.key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm">{row.label}</p>
                  <p className="text-[11px] text-muted-foreground">{row.desc}</p>
                </div>
                <Switch aria-label={row.label} checked={form[row.key]} onCheckedChange={v => setForm({ ...form, [row.key]: v })} />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Tracking</h2>
          <div className="max-w-[200px]">
            <Label htmlFor="msg-default-unit-size" className="text-xs">Default unit size</Label>
<Input id="msg-default-unit-size"
              type="number" min="0.5" step="0.5"
              value={form.defaultUnitSize}
              onChange={e => setForm({ ...form, defaultUnitSize: Number(e.target.value) || 1 })}
              className="mt-1"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Prefilled when you track a pick from your feed.</p>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Reset demo data</p>
            <p className="text-[11px] text-muted-foreground">Restore subscriptions, picks, saves and notifications to their starting state.</p>
          </div>
          <Button
            size="sm" variant="outline" className="text-xs"
            onClick={() => { store.reset(); toast.success('Demo data reset'); }}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
          </Button>
        </section>
      </div>
    </DemoMemberShell>
  );
};

export default DemoMemberSettings;
