import Twitter from "@auth/core/providers/twitter";
import Discord from "@auth/core/providers/discord";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import type { DataModel } from "./_generated/dataModel";
import { configuredSocialProviders } from "./lib/socialAuth";

function sanitizeUsername(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  return cleaned.length >= 2 ? cleaned : undefined;
}

/** Strip nulls — Convex `v.optional(v.string())` rejects explicit null. */
function omitNullish<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

const passwordProvider = Password<DataModel>({
  profile(params) {
    const email = String(params.email ?? "").trim().toLowerCase();
    const username =
      typeof params.username === "string"
        ? params.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "")
        : undefined;
    const fullName =
      typeof params.name === "string"
        ? params.name.trim()
        : typeof params.fullName === "string"
          ? params.fullName.trim()
          : undefined;
    const now = Date.now();
    return {
      email,
      name: fullName || username || email,
      fullName: fullName || undefined,
      username: username || undefined,
      createdAt: now,
      updatedAt: now,
    };
  },
  validatePasswordRequirements(password) {
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
  },
});

const socialConfigured = configuredSocialProviders();

const providers = [
  passwordProvider,
  ...(socialConfigured.twitter
    ? [
        Twitter({
          // Keep stock token/userinfo URLs; add conform/request hooks so prod logs
          // show the real X error body when the Convex OAuth callback fails.
          token: {
            url: "https://api.x.com/2/oauth2/token",
            async conform(response: Response) {
              if (!response.ok) {
                const body = await response.clone().text();
                console.error(
                  `[auth][twitter] token exchange ${response.status}`,
                  body.slice(0, 400),
                );
              }
              return undefined;
            },
          },
          userinfo: {
            url: "https://api.x.com/2/users/me?user.fields=profile_image_url",
            async request(ctx: {
              tokens: { access_token?: string };
            }) {
              const res = await fetch(
                "https://api.x.com/2/users/me?user.fields=profile_image_url",
                {
                  headers: {
                    Authorization: `Bearer ${ctx.tokens.access_token ?? ""}`,
                  },
                },
              );
              const body = await res.text();
              if (!res.ok) {
                console.error(
                  `[auth][twitter] userinfo ${res.status}`,
                  body.slice(0, 400),
                );
                throw new Error(`X userinfo failed (${res.status})`);
              }
              return JSON.parse(body) as Record<string, unknown>;
            },
          },
          // Profile must accept both `{ data: {...} }` (API v2) and rare flat shapes.
          // Never return explicit `null` fields — Convex optional validators reject them.
          profile(twitterProfile) {
            const raw = twitterProfile as {
              id?: string | number;
              id_str?: string;
              name?: string;
              username?: string;
              email?: string | null;
              profile_image_url?: string;
              profile_image_url_https?: string;
              description?: string | null;
              data?: {
                id?: string | number;
                name?: string;
                username?: string;
                email?: string | null;
                profile_image_url?: string;
                description?: string | null;
              };
            };
            const nested = raw.data;
            const id = String(nested?.id ?? raw.id_str ?? raw.id ?? "");
            if (!id) {
              console.error("[auth][twitter] profile payload missing id", {
                keys: Object.keys(raw),
              });
              throw new Error("X profile response missing user id");
            }
            const handle = sanitizeUsername(nested?.username ?? raw.username);
            const name =
              (nested?.name ?? raw.name)?.trim() || handle || "X user";
            const imageRaw =
              nested?.profile_image_url ??
              raw.profile_image_url_https ??
              raw.profile_image_url;
            const image =
              typeof imageRaw === "string"
                ? imageRaw.replace("_normal", "")
                : undefined;
            const description = (
              nested?.description ??
              raw.description ??
              ""
            ).trim();
            const now = Date.now();
            return omitNullish({
              id,
              name,
              email: nested?.email ?? raw.email ?? undefined,
              image,
              username: handle,
              fullName: name,
              bio: description ? description.slice(0, 300) : undefined,
              createdAt: now,
              updatedAt: now,
            }) as {
              id: string;
              name: string;
              email?: string;
              image?: string;
              username?: string;
              fullName?: string;
              bio?: string;
              createdAt: number;
              updatedAt: number;
            };
          },
        }),
      ]
    : []),
  ...(socialConfigured.discord
    ? [
        Discord({
          profile(discordProfile) {
            const profile = discordProfile as {
              id: string;
              username?: string;
              global_name?: string | null;
              email?: string | null;
              image?: string | null;
              avatar?: string | null;
            };
            const display =
              profile.global_name?.trim() ||
              profile.username ||
              "Discord user";
            const avatarUrl =
              profile.image ||
              (profile.avatar
                ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
                : undefined);
            const now = Date.now();
            return omitNullish({
              id: profile.id,
              name: display,
              email: profile.email ?? undefined,
              image: avatarUrl,
              discordId: profile.id,
              discordUsername: profile.username,
              username: sanitizeUsername(profile.username),
              fullName: display,
              createdAt: now,
              updatedAt: now,
            }) as {
              id: string;
              name: string;
              email?: string;
              image?: string;
              discordId: string;
              discordUsername?: string;
              username?: string;
              fullName?: string;
              createdAt: number;
              updatedAt: number;
            };
          },
        }),
      ]
    : []),
];

/**
 * Accept both apex and www when SITE_URL is the canonical www host.
 * Prevents Invalid redirectTo Server Error if the browser origin differs slightly.
 */
function normalizeAppOrigin(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === "prizelet.com") {
      u.hostname = "www.prizelet.com";
    }
    return u.toString().replace(/\/$/, "");
  } catch {
    return url.replace(/\/$/, "");
  }
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers,
  callbacks: {
    async redirect({ redirectTo }) {
      const base = (process.env.SITE_URL ?? "").replace(/\/$/, "");
      if (!base) {
        throw new Error("SITE_URL is not configured");
      }
      if (redirectTo.startsWith("?") || redirectTo.startsWith("/")) {
        return `${base}${redirectTo}`;
      }
      const want = normalizeAppOrigin(redirectTo);
      const site = normalizeAppOrigin(base);
      if (want === site || want.startsWith(`${site}/`) || want.startsWith(`${site}?`)) {
        return want.startsWith("http") ? want : `${site}${want}`;
      }
      // Exact Auth.js / Convex Auth check, after apex→www normalization
      if (redirectTo.startsWith(base)) {
        const after = redirectTo[base.length];
        if (after === undefined || after === "?" || after === "/") {
          return redirectTo;
        }
      }
      throw new Error(
        `Invalid \`redirectTo\` ${redirectTo} for configured SITE_URL: ${base}`,
      );
    },
  },
});
