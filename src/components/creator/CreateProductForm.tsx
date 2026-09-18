import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useConvex, useMutation, useQuery } from 'convex/react';
import {
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Package,
  Repeat,
  Sparkles,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatProductPrice } from '@/lib/creatorProductsDemo';
import { uploadImageToConvex } from '@/lib/upload';
import { kpiIconTone } from '@/lib/kpiIconTones';

const SHORT_MAX = 100;
const FULL_MAX = 2000;

const ACCESS_OPTIONS = [
  { id: 'premium_posts', label: 'Access to premium picks' },
  { id: 'community', label: 'Private community' },
  { id: 'messaging', label: 'Direct messaging' },
  { id: 'exclusive', label: 'Exclusive content' },
] as const;

const ACCESS_HEADING = "What's included:";

function parseStoredDescription(raw: string): { body: string; accessIds: string[] } {
  const marker = `\n\n${ACCESS_HEADING}\n`;
  const idx = raw.lastIndexOf(marker);
  if (idx === -1) return { body: raw, accessIds: [] };
  const body = raw.slice(0, idx).trimEnd();
  const labels = raw
    .slice(idx + marker.length)
    .split('\n')
    .filter((line) => line.startsWith('• '))
    .map((line) => line.slice(2).trim());
  const accessIds = ACCESS_OPTIONS.filter((opt) => labels.includes(opt.label)).map((opt) => opt.id);
  return { body, accessIds };
}

const DEFAULT_FEATURES = [
  'Daily betting picks',
  'Detailed analysis & write-ups',
  'Cancel anytime',
  'Priority support',
];

export type CreateProductInitial = {
  id?: string;
  name: string;
  shortDescription?: string;
  description: string;
  priceCents: number;
  billingPeriod: string;
  isFeatured: boolean;
  isActive: boolean;
  isLimited: boolean;
  isClosed: boolean;
  maxSpots?: number | null;
  imageStorageId?: Id<'_storage'> | null;
  imageUrl?: string | null;
  accessIds?: string[];
};

type Props = {
  creatorId: Id<'creators'>;
  creatorName: string;
  creatorAvatarUrl?: string | null;
  initial?: CreateProductInitial | null;
  demoMode?: boolean;
  onCancel: () => void;
  onSaved: () => void;
};

function Section({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
      <h2 className="mb-4 text-base font-extrabold tracking-tight text-foreground">
        <span className="text-primary">{n}.</span> {title}
      </h2>
      {children}
    </section>
  );
}

export function CreateProductForm({
  creatorId,
  creatorName,
  creatorAvatarUrl,
  initial,
  demoMode = false,
  onCancel,
  onSaved,
}: Props) {
  const convex = useConvex();
  const upsertProduct = useMutation(api.products.mutations.upsert);
  const imageUrlQuery = useQuery(
    api.files.storage.getUrl,
    initial?.imageStorageId ? { storageId: initial.imageStorageId } : 'skip',
  );

  const [name, setName] = useState(initial?.name ?? '');
  const [shortDescription, setShortDescription] = useState(
    initial?.shortDescription ?? '',
  );
  const storedDescription = parseStoredDescription(initial?.description ?? '');
  const [description, setDescription] = useState(storedDescription.body);
  const [price, setPrice] = useState(
    initial ? (initial.priceCents / 100).toFixed(2) : '29.99',
  );
  const isOneTimeInitial = initial?.billingPeriod === 'one-time';
  const [payType, setPayType] = useState<'subscription' | 'one-time'>(
    isOneTimeInitial ? 'one-time' : 'subscription',
  );
  const [billingPeriod, setBillingPeriod] = useState(
    isOneTimeInitial ? 'monthly' : initial?.billingPeriod || 'monthly',
  );
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [access, setAccess] = useState<Set<string>>(() => {
    if (initial?.accessIds && initial.accessIds.length > 0) return new Set(initial.accessIds);
    if (storedDescription.accessIds.length > 0) return new Set(storedDescription.accessIds);
    return new Set(['premium_posts', 'exclusive']);
  });
  const [limitSubs, setLimitSubs] = useState(initial?.isLimited ?? false);
  const [maxSpots, setMaxSpots] = useState(
    initial?.maxSpots != null ? String(initial.maxSpots) : '100',
  );
  const [visibility, setVisibility] = useState<'public' | 'hidden'>(
    initial && !initial.isActive ? 'hidden' : 'public',
  );
  const [imageStorageId, setImageStorageId] = useState<Id<'_storage'> | null>(
    initial?.imageStorageId ?? null,
  );
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    initial?.imageUrl ?? null,
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (imageUrlQuery && !imagePreviewUrl) {
      setImagePreviewUrl(imageUrlQuery);
    }
  }, [imageUrlQuery, imagePreviewUrl]);

  const effectiveBilling = payType === 'one-time' ? 'one-time' : billingPeriod;
  const priceCents = Math.round((Number.parseFloat(price) || 0) * 100);
  const priceLabel = formatProductPrice(priceCents, effectiveBilling);

  const includedFeatures = useMemo(() => {
    const fromAccess = ACCESS_OPTIONS.filter((o) => access.has(o.id)).map((o) => o.label);
    return fromAccess.length > 0 ? fromAccess : DEFAULT_FEATURES;
  }, [access]);

  const toggleAccess = (id: string, checked: boolean) => {
    setAccess((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleImagePick = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const { storageId, url } = await uploadImageToConvex(convex, file, 'product-image');
      setImageStorageId(storageId);
      setImagePreviewUrl(url);
      toast.success('Image uploaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const clearImage = () => {
    setImageStorageId(null);
    setImagePreviewUrl(null);
  };

  const buildDescription = (): string => {
    const body = description.trim();
    const featureBlock =
      includedFeatures.length > 0
        ? `\n\nWhat's included:\n${includedFeatures.map((f) => `• ${f}`).join('\n')}`
        : '';
    return `${body}${featureBlock}`.trim().slice(0, FULL_MAX + 400);
  };

  const save = async (asDraft: boolean) => {
    if (demoMode) {
      toast.message('Sample preview', {
        description: 'Leave demo mode to save a real product (?demo=0 or publish your first live product).',
      });
      return;
    }
    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (Number.isNaN(Number.parseFloat(price)) || priceCents <= 0) {
      toast.error('Enter a valid price');
      return;
    }
    if (limitSubs) {
      const n = Number.parseInt(maxSpots, 10);
      if (!Number.isFinite(n) || n < 1) {
        toast.error('Enter a valid subscriber limit');
        return;
      }
    }

    setSaving(true);
    try {
      await upsertProduct({
        productId: initial?.id ? (initial.id as Id<'products'>) : undefined,
        creatorId,
        name: name.trim(),
        shortDescription: shortDescription.trim() || undefined,
        description: buildDescription() || undefined,
        imageStorageId: imageStorageId,
        priceCents,
        billingPeriod: effectiveBilling,
        isFeatured,
        isActive: !asDraft && visibility === 'public',
        isLimited: limitSubs,
        maxSpots: limitSubs ? Number.parseInt(maxSpots, 10) : undefined,
        isClosed: initial?.isClosed ?? false,
      });
      toast.success(
        asDraft
          ? 'Draft saved'
          : initial?.id
            ? 'Product updated'
            : 'Product published',
      );
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-10">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => void handleImagePick(e.target.files?.[0])}
      />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onCancel}
            className="mb-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to Products
          </button>
          <h1 className="text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
            {initial?.id ? 'Edit Product' : 'Create Product'}
          </h1>
          <p className="mt-1.5 max-w-xl text-support text-muted-foreground">
            Set up your product and start earning. You can always edit it later.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 rounded-xl"
            disabled={saving || uploading}
            onClick={() => void save(true)}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            className="min-h-11 rounded-xl"
            disabled={saving || uploading}
            onClick={() => void save(false)}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {initial?.id ? 'Publish changes' : 'Publish Product'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 xl:items-start">
        <div className="flex flex-col gap-4 xl:col-span-8">
          <Section n={1} title="Basic Information">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cp-name">Product Name</Label>
                <Input
                  id="cp-name"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 80))}
                  placeholder="e.g. Premium Picks"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="cp-short">Short Description</Label>
                  <span className="text-caption tabular-nums text-muted-foreground">
                    {shortDescription.length}/{SHORT_MAX}
                  </span>
                </div>
                <Input
                  id="cp-short"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value.slice(0, SHORT_MAX))}
                  placeholder="One-line pitch for your storefront card"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="cp-full">Full Description</Label>
                  <span className="text-caption tabular-nums text-muted-foreground">
                    {description.length}/{FULL_MAX}
                  </span>
                </div>
                <Textarea
                  id="cp-full"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, FULL_MAX))}
                  placeholder="Explain what subscribers get, your edge, and how often you publish…"
                  rows={6}
                  className="rounded-xl"
                />
              </div>
            </div>
          </Section>

          <Section n={2} title="Product Image">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
                {imagePreviewUrl ? (
                  <img
                    src={imagePreviewUrl}
                    alt=""
                    className="aspect-video w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Package className="h-8 w-8" aria-hidden />
                    <p className="text-xs font-semibold">No image yet</p>
                  </div>
                )}
                {imagePreviewUrl ? (
                  <div className="flex gap-2 border-t border-border p-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      disabled={uploading}
                      onClick={() => fileRef.current?.click()}
                    >
                      Edit Image
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-destructive"
                      onClick={clearImage}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background/60 px-4 py-8 text-center transition-colors hover:border-primary/40 hover:bg-muted/40"
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl', kpiIconTone.violet)}>
                    <ImagePlus className="h-5 w-5" aria-hidden />
                  </span>
                )}
                <p className="text-sm font-bold text-foreground">Upload new image</p>
                <p className="max-w-[220px] text-xs text-muted-foreground">
                  Recommended 1280×720 (16:9). PNG, JPG or WebP. Max 5MB.
                </p>
              </button>
            </div>
          </Section>

          <Section n={3} title="Pricing">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPayType('subscription')}
                className={cn(
                  'rounded-xl border p-4 text-left transition-colors',
                  payType === 'subscription'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border hover:bg-muted/40',
                )}
              >
                <Repeat className="mb-2 h-5 w-5 text-primary" aria-hidden />
                <p className="text-sm font-extrabold">Subscription</p>
                <p className="mt-1 text-xs text-muted-foreground">Recurring revenue</p>
              </button>
              <button
                type="button"
                onClick={() => setPayType('one-time')}
                className={cn(
                  'rounded-xl border p-4 text-left transition-colors',
                  payType === 'one-time'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border hover:bg-muted/40',
                )}
              >
                <Upload className="mb-2 h-5 w-5 text-primary" aria-hidden />
                <p className="text-sm font-extrabold">One-time payment</p>
                <p className="mt-1 text-xs text-muted-foreground">Single purchase</p>
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cp-price">Price (USD)</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="cp-price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="h-11 rounded-xl ps-7"
                  />
                </div>
              </div>
              {payType === 'subscription' ? (
                <div className="space-y-2">
                  <Label>Billing frequency</Label>
                  <Select value={billingPeriod} onValueChange={setBillingPeriod}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">per week</SelectItem>
                      <SelectItem value="monthly">per month</SelectItem>
                      <SelectItem value="yearly">per year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex items-end">
                  <p className="rounded-xl border border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
                    Charged once at checkout
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-3 opacity-70">
                <div>
                  <p className="text-sm font-semibold">Offer a free trial</p>
                  <p className="text-xs text-muted-foreground">Coming soon — not saved yet</p>
                </div>
                <Switch checked={false} disabled aria-label="Free trial coming soon" />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-3 opacity-70">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">Set up yearly pricing (with discount)</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Coming soon. Choose Yearly billing above for a single yearly price.
                  </p>
                </div>
                <Switch checked={false} disabled aria-label="Yearly discount coming soon" />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-3">
                <div>
                  <p className="text-sm font-semibold">Featured / Most Popular</p>
                  <p className="text-xs text-muted-foreground">Highlight on your storefront</p>
                </div>
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
              </div>
            </div>
          </Section>

          <Section n={4} title="Access & Content">
            <ul className="space-y-3">
              {ACCESS_OPTIONS.map((opt) => (
                <li key={opt.id} className="flex items-center gap-3">
                  <Checkbox
                    id={`access-${opt.id}`}
                    checked={access.has(opt.id)}
                    onCheckedChange={(v) => toggleAccess(opt.id, v === true)}
                  />
                  <Label htmlFor={`access-${opt.id}`} className="font-semibold">
                    {opt.label}
                  </Label>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              These show in the preview “What’s included” list and are saved into the product description.
            </p>
          </Section>

          <Section n={5} title="Additional Settings">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-3">
                <div>
                  <p className="text-sm font-semibold">Set a maximum number of subscribers</p>
                  <p className="text-xs text-muted-foreground">Scarcity / limited spots</p>
                </div>
                <Switch checked={limitSubs} onCheckedChange={setLimitSubs} />
              </div>
              {limitSubs ? (
                <div className="space-y-2 pl-1">
                  <Label htmlFor="cp-max">Max subscribers</Label>
                  <Input
                    id="cp-max"
                    type="number"
                    min="1"
                    value={maxSpots}
                    onChange={(e) => setMaxSpots(e.target.value)}
                    className="h-11 w-36 rounded-xl"
                  />
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-3 opacity-70">
                <div>
                  <p className="text-sm font-semibold">Set an expiration date</p>
                  <p className="text-xs text-muted-foreground">Coming soon — not saved yet</p>
                </div>
                <Switch checked={false} disabled aria-label="Expiration date coming soon" />
              </div>
            </div>
          </Section>

          <Section n={6} title="Visibility">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={cn(
                  'rounded-xl border p-4 text-left transition-colors',
                  visibility === 'public'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border hover:bg-muted/40',
                )}
              >
                <Eye className="mb-2 h-5 w-5 text-primary" aria-hidden />
                <p className="text-sm font-extrabold">Public</p>
                <p className="mt-1 text-xs text-muted-foreground">Visible on your profile</p>
              </button>
              <button
                type="button"
                onClick={() => setVisibility('hidden')}
                className={cn(
                  'rounded-xl border p-4 text-left transition-colors',
                  visibility === 'hidden'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border hover:bg-muted/40',
                )}
              >
                <EyeOff className="mb-2 h-5 w-5 text-primary" aria-hidden />
                <p className="text-sm font-extrabold">Hidden</p>
                <p className="mt-1 text-xs text-muted-foreground">Not listed on public profile</p>
              </button>
            </div>
            {initial?.isClosed ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Sales are already closed for this product. Visibility does not reopen checkout — use
                Access Control for that.
              </p>
            ) : null}
          </Section>
        </div>

        {/* Live preview */}
        <aside className="xl:col-span-4">
          <div className="sticky top-4 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-extrabold text-foreground">Preview</p>
              <p className="text-xs text-muted-foreground">How fans will see this offer</p>
            </div>
            <div className="aspect-video bg-muted/40">
              {imagePreviewUrl ? (
                <img src={imagePreviewUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Sparkles className="h-8 w-8 opacity-40" aria-hidden />
                </div>
              )}
            </div>
            <div className="space-y-4 p-5">
              <div>
                <p className="text-lg font-extrabold tracking-tight text-foreground">
                  {name.trim() || 'Product name'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {shortDescription.trim() ||
                    description.trim().slice(0, 100) ||
                    'Short description appears here.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {creatorAvatarUrl ? (
                  <img
                    src={creatorAvatarUrl}
                    alt=""
                    className="h-8 w-8 rounded-full border border-border object-cover"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {creatorName.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{creatorName}</p>
                  <p className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <Star className="h-3 w-3 fill-current" aria-hidden />
                    4.9
                    <span className="font-medium text-muted-foreground">(120 reviews)</span>
                  </p>
                </div>
              </div>
              <div>
                <p className="text-2xl font-extrabold tabular-nums text-foreground">{priceLabel}</p>
                <Button type="button" className="mt-3 h-11 w-full rounded-xl" disabled>
                  Get Access
                </Button>
              </div>
              <div>
                <p className="mb-2 text-sm font-extrabold text-foreground">What&apos;s included</p>
                <ul className="space-y-2">
                  {includedFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
