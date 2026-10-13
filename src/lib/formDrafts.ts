import { z } from "zod";

export const DRAFT_PREFIX = "sweeph.draft.v1:";
export const DRAFT_TTL = 24 * 60 * 60 * 1000;
const memory = new Map<string, string | null>();
const volatileKeys = new Set<string>();
const warnBeforeUnload = (event: BeforeUnloadEvent) => {
  if (volatileKeys.size === 0) return;
  event.preventDefault();
  event.returnValue = "";
};
function trackVolatile(key: string, failed: boolean) {
  if (failed) volatileKeys.add(key);
  else volatileKeys.delete(key);
  window.removeEventListener("beforeunload", warnBeforeUnload);
  if (volatileKeys.size)
    window.addEventListener("beforeunload", warnBeforeUnload);
}
const text = z.string().max(50_000);
export const postDraftSchema = z.object({
  editId: text.nullable(),
  title: text,
  sport: text,
  event: text,
  pick: text,
  usOdds: text,
  euOdds: text,
  units: text,
  tags: text,
  notes: text,
  visibilityMode: z.enum(["all", "products", "premium"]),
  selectedProductIds: z.array(text),
  oddsSource: z.enum(["us", "eu"]).nullable(),
});
export const productDraftSchema = z.object({
  recordId: text.nullable(),
  name: text,
  shortDescription: text,
  description: text,
  price: text,
  payType: z.enum(["subscription", "one-time"]),
  billingPeriod: text,
  yearlyPricing: z.boolean(),
  access: z.array(text),
  linkedPostId: text,
  limitSubs: z.boolean(),
  maxSpots: text,
  expiration: z.boolean(),
  expiresOn: text,
  visibility: z.enum(["public", "hidden"]),
  isFeatured: z.boolean(),
  imageStorageId: text.nullable(),
  uploadedImageUrl: text.nullable(),
});
export const creatorProfileDraftSchema = z.object({
  displayName: text,
  bio: text,
  avatarUrl: text,
  bannerUrl: text,
  discordServerId: text,
  discordRoleId: text,
  brandName: text,
  logoUrl: text,
  faviconUrl: text,
  primaryColor: text,
  secondaryColor: text,
  accentColor: text,
  brandFont: text,
});
export const memberProfileDraftSchema = z.object({
  fullName: text,
  phone: text,
});
export const messageDraftSchema = z.object({ body: text });
export const onboardingDraftSchema = z.object({
  step: z.number().int().min(0).max(2),
  displayName: text,
  username: text,
  bio: text,
  avatarUrl: text,
  pendingPhotoName: text,
});

export type DraftRecord<T> = {
  version: 1;
  updatedAt: number;
  data: T;
  baseline: T;
};
export function draftKey(owner: string, form: string) {
  return `${DRAFT_PREFIX}${owner}:${form}`;
}
export function readDraft<T>(
  key: string,
  schema: z.ZodType<T>,
): DraftRecord<T> | null {
  try {
    const raw = memory.has(key) ? memory.get(key) : sessionStorage.getItem(key);
    if (!raw || raw.length > 300_000) return null;
    const record = z
      .object({
        version: z.literal(1),
        updatedAt: z.number(),
        data: schema,
        baseline: schema,
      })
      .parse(JSON.parse(raw));
    if (
      record.updatedAt > Date.now() ||
      Date.now() - record.updatedAt > DRAFT_TTL
    ) {
      removeDraft(key);
      return null;
    }
    return record as DraftRecord<T>;
  } catch {
    return null;
  }
}
export function writeDraft<T>(key: string, data: T, baseline: T): boolean {
  const raw = JSON.stringify({
    version: 1,
    updatedAt: Date.now(),
    data,
    baseline,
  });
  // Memory also protects SPA navigation when browser storage is unavailable.
  memory.set(key, raw);
  try {
    sessionStorage.setItem(key, raw);
    trackVolatile(key, false);
    return true;
  } catch {
    // Keep the reload warning even after navigation unmounts the form.
    trackVolatile(key, true);
    return false;
  }
}
export function removeDraft(key: string): boolean {
  // A tombstone prevents an old disk copy resurfacing during this page session.
  memory.set(key, null);
  trackVolatile(key, false);
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch {
    try {
      sessionStorage.setItem(key, "null");
      return true;
    } catch {
      return false;
    }
  }
}
