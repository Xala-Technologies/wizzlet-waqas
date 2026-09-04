import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Save, RotateCcw, Building2, SlidersHorizontal, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDemoAdminStore } from '@/components/demo/demoAdminStore';

const DemoAdminSettings = () => {
  const store = useDemoAdminStore();
  const { settings } = store.state;
  const [form, setForm] = useState(settings);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => { setForm(settings); }, [settings]);

  const dirty = JSON.stringify(form) !== JSON.stringify(settings);

  const save = () => {
    if (!form.platformName.trim()) { toast.error('Platform name is required'); return; }
    if (!/^\S+@\S+\.\S+$/.test(form.supportEmail)) { toast.error('Enter a valid support email'); return; }
    if (form.minPayoutAmount < 0) { toast.error('Minimum payout cannot be negative'); return; }
    store.updateSettings(form);
    toast.success('Platform settings saved');
  };

  const toggles = [
    { key: 'autoApproveCreators' as const, label: 'Auto-approve creators', desc: 'New applications go live without manual review' },
    { key: 'creatorMessagingEnabled' as const, label: 'Creator messaging', desc: 'Allow creators to message their subscribers' },
    { key: 'growthManagerEnabled' as const, label: 'Growth Manager', desc: 'Enable AI coaching and creator–admin chat' },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Branding, payouts and feature switches</p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-[11px] text-muted-foreground">Unsaved changes</span>}
          {dirty && (
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => setForm(settings)}>Discard</Button>
          )}
          <Button size="sm" className="text-xs" disabled={!dirty} onClick={save}>
            <Save className="mr-1.5 h-3.5 w-3.5" /> Save settings
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Branding</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="set-platform-name" className="text-xs">Platform name</Label>
<Input id="set-platform-name" value={form.platformName} onChange={e => setForm({ ...form, platformName: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="set-support-email" className="text-xs">Support email</Label>
<Input id="set-support-email" type="email" value={form.supportEmail} onChange={e => setForm({ ...form, supportEmail: e.target.value })} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="set-tagline" className="text-xs">Tagline</Label>
<Input id="set-tagline" value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} className="mt-1" />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-primary" /> Payouts</h2>
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
            <div>
              <Label htmlFor="set-minimum-payout-amount" className="text-xs">Minimum payout amount ($)</Label>
<Input id="set-minimum-payout-amount"
                type="number" min="0" step="5"
                value={form.minPayoutAmount}
                onChange={e => setForm({ ...form, minPayoutAmount: Number(e.target.value) || 0 })}
                className="mt-1"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Creators can only request a payout above this balance.</p>
            </div>
            <div>
              <Label htmlFor="set-payout-schedule" className="text-xs">Payout schedule</Label>
              <select
                id="set-payout-schedule"
                value={form.payoutSchedule}
                onChange={e => setForm({ ...form, payoutSchedule: e.target.value as typeof form.payoutSchedule })}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every two weeks</option>
                <option value="monthly">Monthly</option>
              </select>
              <p className="text-[11px] text-muted-foreground mt-1">How often eligible creator balances are paid out.</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Features</h2>
          <div className="space-y-3">
            {toggles.map(t => (
              <div key={t.key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm">{t.label}</p>
                  <p className="text-[11px] text-muted-foreground">{t.desc}</p>
                </div>
                <Switch aria-label={t.label} checked={form[t.key]} onCheckedChange={v => setForm({ ...form, [t.key]: v })} />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Reset demo data</p>
            <p className="text-[11px] text-muted-foreground">Restore creators, users, transactions and settings to their starting state.</p>
          </div>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => setConfirmReset(true)}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
          </Button>
        </section>
      </div>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all demo data?</AlertDialogTitle>
            <AlertDialogDescription>
              This restores creators, applications, users, transactions, fee rules and settings to their starting state. Any changes you made in the Owner demo — including unsaved edits — will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { store.reset(); setConfirmReset(false); toast.success('Demo data reset to defaults'); }}>
              Reset everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DemoAdminSettings;
