import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useConvex, useMutation, useQuery } from 'convex/react';
import {
  Bold,
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Package,
  Repeat,
  Sparkles,
  Star,
  Trash2,
  Underline,
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
  { id: 'premium_posts', label: 'Access to premium posts' },
  { id: 'community', label: 'Access to private community' },
  { id: 'messaging', label: 'Direct messaging' },
  { id: 'exclusive', label: 'Exclusive content' },
] as const;

/** Legacy labels from older saves — still recognized when parsing. */
const ACCESS_LABEL_ALIASES: Record<string, string> = {
  'Access to premium picks': 'premium_posts',
  'Private community': 'community',
};

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
  const accessIds: string[] = [];
  for (const label of labels) {
    const direct = ACCESS_OPTIONS.find((opt) => opt.label === label);
    if (direct) {
      accessIds.push(direct.id);
      continue;
    }
    const alias = ACCESS_LABEL_ALIASES[label];
    if (alias) accessIds.push(alias);
  }
  return { body, accessIds };
}

const DEFAULT_FEATURES = [
  'Daily betting picks',
  'Detailed analysis & write-ups',
  'Betting models & angles',
  'Cancel anytime',
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

function wrapSelection(
  value: string,
  start: number,
  end: number,
  before: string,
  after: string,
): { next: string; cursor: number } {
  const selected = value.slice(start, end) || 'text';
  const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
  return { next, cursor: start + before.length + selected.length + after.length };
}

function DescriptionToolbar({
  textareaRef,
  value,
  onChange,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (next: string) => void;
}) {
  const apply = (before: string, after: string) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const { next, cursor } = wrapSelection(value, start, end, before, after);
    onChange(next.slice(0, FULL_MAX));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(cursor, cursor);
    });
  };

  const insertBlock = (prefix: string) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || 'item';
    const lines = selected
      .split('\n')
      .map((line) => `${prefix}${line.replace(/^[-*]\s+|^(\d+)\.\s+/, '')}`)
      .join('\n');
    const next = `${value.slice(0, start)}${lines}${value.slice(end)}`;
    onChange(next.slice(0, FULL_MAX));
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-xl border border-b-0 border-border bg-muted/40 px-2 py-1.5">
      <span className="mr-1 hidden px-2 text-xs font-semibold text-muted-foreground sm:inline">
        Normal text
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label="Bold"
        onClick={() => apply('**', '**')}
      >
        <Bold className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label="Italic"
        onClick={() => apply('_', '_')}
      >
        <Italic className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label="Underline"
        onClick={() => apply('<u>', '</u>')}
      >
        <Underline className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label="Bulleted list"
        onClick={() => insertBlock('- ')}
      >
        <List className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label="Numbered list"
        onClick={() => insertBlock('1. ')}
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label="Link"
        onClick={() => apply('[', '](https://)')}
      >
        <Link2 className="h-3.5 w-3.5" />
      </Button>
    </div>
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
  const posts = useQuery(api.posts.queries.listMine);
  const imageUrlQuery = useQuery(
    api.files.storage.getUrl,
    initial?.imageStorageId ? { storageId: initial.imageStorageId } : 'skip',
  );

  const [name, setName] = useState(initial?.name ?? 'Premium Picks');
  const [shortDescription, setShortDescription] = useState(
    initial?.shortDescription ??
      (initial ? '' : 'Daily betting picks, analysis and more.'),
  );
  const storedDescription = parseStoredDescription(initial?.description ?? '');
  const [description, setDescription] = useState(
    storedDescription.body ||
      (initial
        ? ''
        : 'Get my best daily picks with clear unit sizing, write-ups, and early locks before the open.'),
  );
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
  const [freeTrial, setFreeTrial] = useState(true);
  const [trialDays, setTrialDays] = useState('7');
  const [yearlyPricing, setYearlyPricing] = useState(false);
  const [access, setAccess] = useState<Set<string>>(() => {
    if (initial?.accessIds && initial.accessIds.length > 0) return new Set(initial.accessIds);
    if (storedDescription.accessIds.length > 0) return new Set(storedDescription.accessIds);
    return new Set(ACCESS_OPTIONS.map((o) => o.id));
  });
  const [linkedPostId, setLinkedPostId] = useState<string>('none');
  const [limitSubs, setLimitSubs] = useState(initial?.isLimited ?? false);
  const [maxSpots, setMaxSpots] = useState(
    initial?.maxSpots != null ? String(initial.maxSpots) : '100',
  );
  const [expiration, setExpiration] = useState(false);
  const [expiresOn, setExpiresOn] = useState('');
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
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

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
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5MB or smaller');
      return;
    }
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
    const extras: string[] = [];
    if (freeTrial && payType === 'subscription') {
      extras.push(`Free trial: ${trialDays.trim() || '7'} days`);
    }
    if (expiration && expiresOn) {
      extras.push(`Expires on: ${expiresOn}`);
    }
    if (linkedPostId !== 'none') {
      const post = (posts ?? []).find((p) => p._id === linkedPostId);
      if (post) extras.push(`Linked content: ${post.title}`);
    }
    const meta =
      extras.length > 0 ? `\n\n${extras.map((line) => `• ${line}`).join('\n')}` : '';
    const featureBlock =
      includedFeatures.length > 0
        ? `\n\nWhat's included:\n${includedFeatures.map((f) => `• ${f}`).join('\n')}`
        : '';
    return `${body}${meta}${featureBlock}`.trim().slice(0, FULL_MAX + 500);
  };

  const save = async (asDraft: boolean) => {
    if (demoMode) {
      toast.message('Sample preview', {
        description:
          'Leave demo mode to save a real product (?demo=0 or publish your first live product).',
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
        isFeatured: false,
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
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {initial?.id ? 'Edit Product' : 'Create Product'}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm font-medium text-muted-foreground">
            Set up your product and start earning. You can always edit it later.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl"
            disabled={saving || uploading}
            onClick={() => void save(true)}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            className="h-11 rounded-xl"
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
                <Textarea
                  id="cp-short"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value.slice(0, SHORT_MAX))}
                  placeholder="One-line pitch for your storefront card"
                  rows={2}
                  className="resize-none rounded-xl"
                />
              </div>
              <div className="space-y-0">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label htmlFor="cp-full">Full Description</Label>
                  <span className="text-caption tabular-nums text-muted-foreground">
                    {description.length}/{FULL_MAX}
                  </span>
                </div>
                <DescriptionToolbar
                  textareaRef={descriptionRef}
                  value={description}
                  onChange={setDescription}
                />
                <Textarea
                  id="cp-full"
                  ref={descriptionRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, FULL_MAX))}
                  placeholder="Explain what subscribers get, your edge, and how often you publish…"
                  rows={7}
                  className="rounded-t-none rounded-b-xl border-t-0"
                />
              </div>
            </div>
          </Section>

          <Section n={2} title="Product Image">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
                {imagePreviewUrl ? (
                  <div className="relative">
                    <img
                      src={imagePreviewUrl}
                      alt=""
                      className="aspect-video w-full object-cover"
                    />
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-lg bg-background/95 text-foreground hover:bg-background"
                        disabled={uploading}
                        onClick={() => fileRef.current?.click()}
                      >
                        Edit Image
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-lg bg-background/95"
                        onClick={clearImage}
                        aria-label="Remove image"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Package className="h-8 w-8" aria-hidden />
                    <p className="text-xs font-semibold">No image yet</p>
                  </div>
                )}
              </div>
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background/60 px-4 py-8 text-center transition-colors hover:border-primary/40 hover:bg-muted/40"
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <span
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-xl',
                      kpiIconTone.violet,
                    )}
                  >
                    <ImagePlus className="h-5 w-5" aria-hidden />
                  </span>
                )}
                <p className="text-sm font-bold text-foreground">Upload new image</p>
                <p className="max-w-sm text-xs text-muted-foreground">
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
                onClick={() => {
                  setPayType('one-time');
                  setFreeTrial(false);
                  setYearlyPricing(false);
                }}
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

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="cp-price">Price</Label>
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
                <div className="w-full space-y-2 sm:w-[160px]">
                  <Label>Frequency</Label>
                  <Select
                    value={billingPeriod}
                    onValueChange={(v) => {
                      setBillingPeriod(v);
                      setYearlyPricing(v === 'yearly');
                    }}
                  >
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
                <p className="rounded-xl border border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground sm:mb-0.5">
                  Charged once at checkout
                </p>
              )}
            </div>

            {payType === 'subscription' ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-border px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Offer a free trial</p>
                      <p className="text-xs text-muted-foreground">
                        Let fans try before they buy
                      </p>
                    </div>
                    <Switch checked={freeTrial} onCheckedChange={setFreeTrial} />
                  </div>
                  {freeTrial ? (
                    <div className="mt-3 space-y-2 border-t border-border pt-3">
                      <Label htmlFor="cp-trial">Trial length</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="cp-trial"
                          type="number"
                          min="1"
                          max="90"
                          value={trialDays}
                          onChange={(e) => setTrialDays(e.target.value)}
                          className="h-10 w-24 rounded-xl"
                        />
                        <span className="text-sm font-medium text-muted-foreground">days</span>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">
                        Set up yearly pricing (with discount)
                      </p>
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Offer an annual plan alongside monthly
                    </p>
                  </div>
                  <Switch
                    checked={yearlyPricing}
                    onCheckedChange={(on) => {
                      setYearlyPricing(on);
                      if (on) setBillingPeriod('yearly');
                      else if (billingPeriod === 'yearly') setBillingPeriod('monthly');
                    }}
                  />
                </div>
              </div>
            ) : null}
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
            <div className="mt-4 space-y-2">
              <Label>Select existing content (optional)</Label>
              <Select value={linkedPostId} onValueChange={setLinkedPostId}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select existing content (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(posts ?? []).slice(0, 20).map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Section>

          <Section n={5} title="Additional Settings">
            <div className="space-y-3">
              <div className="rounded-xl border border-border px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Set a maximum number of subscribers</p>
                    <p className="text-xs text-muted-foreground">Scarcity / limited spots</p>
                  </div>
                  <Switch checked={limitSubs} onCheckedChange={setLimitSubs} />
                </div>
                {limitSubs ? (
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
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
              </div>

              <div className="rounded-xl border border-border px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Set an expiration date</p>
                    <p className="text-xs text-muted-foreground">
                      Auto-archive after this date
                    </p>
                  </div>
                  <Switch checked={expiration} onCheckedChange={setExpiration} />
                </div>
                {expiration ? (
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    <Label htmlFor="cp-expires">Expires on</Label>
                    <Input
                      id="cp-expires"
                      type="date"
                      value={expiresOn}
                      onChange={(e) => setExpiresOn(e.target.value)}
                      className="h-11 w-full max-w-xs rounded-xl"
                    />
                  </div>
                ) : null}
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
                <p className="mt-1 text-xs text-muted-foreground">Accessible via link only</p>
              </button>
            </div>
            {initial?.isClosed ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Sales are already closed for this product. Visibility does not reopen checkout —
                use Access Control for that.
              </p>
            ) : null}
          </Section>
        </div>

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
                {freeTrial && payType === 'subscription' ? (
                  <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {trialDays || '7'}-day free trial
                  </p>
                ) : null}
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
