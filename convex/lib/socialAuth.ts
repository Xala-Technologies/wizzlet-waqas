/** Detect which social OAuth providers have Convex env credentials. */

function hasEnvPair(idKey: string, secretKey: string): boolean {
  const id = process.env[idKey]?.trim();
  const secret = process.env[secretKey]?.trim();
  return Boolean(id && secret);
}

export function configuredSocialProviders(): {
  twitter: boolean;
  discord: boolean;
} {
  return {
    twitter: hasEnvPair("AUTH_TWITTER_ID", "AUTH_TWITTER_SECRET"),
    discord: hasEnvPair("AUTH_DISCORD_ID", "AUTH_DISCORD_SECRET"),
  };
}
