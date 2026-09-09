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
          // Request profile fields needed for creator onboarding prefills.
          userinfo: {
            url: "https://api.twitter.com/2/users/me",
            params: {
              "user.fields":
                "profile_image_url,username,name,description,url,confirmed_email",
            },
          },
          profile(twitterProfile) {
            const data = twitterProfile as {
              id?: string | number;
              id_str?: string;
              name?: string;
              username?: string;
              screen_name?: string;
              email?: string | null;
              description?: string | null;
              profile_image_url?: string;
              profile_image_url_https?: string;
              data?: {
                id?: string;
                name?: string;
                username?: string;
                profile_image_url?: string;
                description?: string | null;
                confirmed_email?: string | null;
              };
            };
            const nested = data.data;
            const id = String(nested?.id ?? data.id_str ?? data.id ?? "");
            const handle = sanitizeUsername(
              nested?.username ?? data.username ?? data.screen_name,
            );
            const imageRaw =
              nested?.profile_image_url ??
              data.profile_image_url_https ??
              data.profile_image_url;
            const image =
              typeof imageRaw === "string"
                ? imageRaw.replace("_normal", "")
                : undefined;
            const name = nested?.name ?? data.name ?? handle ?? "X user";
            const description = (
              nested?.description ??
              data.description ??
              ""
            ).trim();
            const email =
              nested?.confirmed_email ?? data.email ?? undefined;
            const now = Date.now();
            return {
              id,
              name,
              email: email || undefined,
              image,
              username: handle,
              fullName: name,
              bio: description ? description.slice(0, 300) : undefined,
              createdAt: now,
              updatedAt: now,
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
            return {
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
            };
          },
        }),
      ]
    : []),
];

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers,
});
