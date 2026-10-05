import { Button } from '@/components/ui/button';
import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { authCallbackUrl, ensureCanonicalAuthOrigin } from '@/lib/authSession';
import { storeReferralCode } from '@/lib/referralHandoff';
import { storeReturnTo } from '@/lib/safeReturnPath';

function DiscordMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#5865F2" aria-hidden>
      <path d="M19.27 5.33A17.4 17.4 0 0 0 14.94 4l-.3.55a16.1 16.1 0 0 1 3.13.84 16.6 16.6 0 0 0-13.54 0A16 16 0 0 1 7.36 4L7.06 4a17.4 17.4 0 0 0-4.33 1.33C.46 9.05-.28 12.66.09 16.22A17.6 17.6 0 0 0 5.4 19.1l.72-.96a11.4 11.4 0 0 1-1.8-.86l.36-.27c3.57 1.67 7.44 1.67 11.01 0l.36.27c-.57.34-1.17.63-1.8.86l.72.96a17.6 17.6 0 0 0 5.31-2.88c.43-4.02-.73-7.6-1.71-10.89ZM8.02 14.53c-1.07 0-1.95-.98-1.95-2.18s.86-2.18 1.95-2.18 1.97.98 1.95 2.18c0 1.2-.86 2.18-1.95 2.18Zm7.96 0c-1.07 0-1.95-.98-1.95-2.18s.86-2.18 1.95-2.18 1.97.98 1.95 2.18c0 1.2-.86 2.18-1.95 2.18Z" />
    </svg>
  );
}

type SocialProvider = 'twitter' | 'discord';

interface SocialAuthButtonsProps {
  /** Where Convex Auth redirects after OAuth (must be an app route). */
  redirectTo?: string;
  mode?: 'signin' | 'signup';
  /** Optional deep-link path stashed for AuthCallback after OAuth. */
  returnTo?: string | null;
  /** Optional creator referral code (`?ref=`) stashed for AuthCallback after OAuth. */
  referralCode?: string | null;
}

export function SocialAuthButtons({
  redirectTo = '/auth/callback',
  mode = 'signin',
  returnTo = null,
  referralCode = null,
}: SocialAuthButtonsProps) {
  const { signIn } = useAuthActions();
  const available = useQuery(api.authProviders.socialProviders);
  const [pending, setPending] = useState<SocialProvider | null>(null);

  const start = async (provider: SocialProvider) => {
    setPending(provider);
    try {
      // PKCE verifier is origin-scoped; OAuth must start and finish on SITE_URL.
      if (ensureCanonicalAuthOrigin()) return;
      storeReturnTo(returnTo);
      storeReferralCode(referralCode);
      // Must match Convex SITE_URL (see VITE_SITE_URL) — not the random Vite preview port.
      await signIn(provider, { redirectTo: authCallbackUrl(redirectTo) });
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const siteMismatch = /Invalid `redirectTo`|SITE_URL/i.test(raw);
      toast.error(
        siteMismatch
          ? `Auth origin mismatch. Open the app at ${import.meta.env.VITE_SITE_URL ?? 'http://127.0.0.1:8080'} (Convex SITE_URL), not a preview port.`
          : err instanceof Error
            ? err.message
            : `${provider === 'twitter' ? 'X' : 'Discord'} sign-in is not configured yet.`,
      );
      setPending(null);
    }
  };

  const verb = mode === 'signup' ? 'Continue' : 'Continue';
  const showTwitter = available?.twitter === true;
  const showDiscord = available?.discord === true;

  if (available === undefined) {
    return null;
  }
  if (!showTwitter && !showDiscord) {
    return null;
  }

  return (
    <div className="space-y-3">
      {showTwitter ? (
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full justify-center gap-2.5 rounded-xl border-border bg-card font-medium text-foreground shadow-none"
          disabled={pending !== null}
          onClick={() => void start('twitter')}
        >
          {pending === 'twitter' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="text-[15px] font-semibold leading-none" aria-hidden>
              𝕏
            </span>
          )}
          {verb} with X
        </Button>
      ) : null}
      {showDiscord ? (
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full justify-center gap-2.5 rounded-xl border-border bg-card font-medium text-foreground shadow-none"
          disabled={pending !== null}
          onClick={() => void start('discord')}
        >
          {pending === 'discord' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <DiscordMark className="h-4 w-4" />
          )}
          {verb} with Discord
        </Button>
      ) : null}
    </div>
  );
}

/** Divider + social buttons; hides entirely when no OAuth providers are configured. */
export function SocialAuthSection(props: SocialAuthButtonsProps) {
  const available = useQuery(api.authProviders.socialProviders);
  if (available === undefined) return null;
  if (!available.twitter && !available.discord) return null;

  return (
    <>
      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-[12px] text-muted-foreground">or</span>
        </div>
      </div>
      <SocialAuthButtons {...props} />
    </>
  );
}
