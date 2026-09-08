import { Button } from '@/components/ui/button';
import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type SocialProvider = 'twitter' | 'discord';

interface SocialAuthButtonsProps {
  /** Where Convex Auth redirects after OAuth (must be an app route). */
  redirectTo?: string;
  mode?: 'signin' | 'signup';
}

export function SocialAuthButtons({
  redirectTo = '/auth/callback',
  mode = 'signin',
}: SocialAuthButtonsProps) {
  const { signIn } = useAuthActions();
  const available = useQuery(api.authProviders.socialProviders);
  const [pending, setPending] = useState<SocialProvider | null>(null);

  const start = async (provider: SocialProvider) => {
    setPending(provider);
    try {
      await signIn(provider, { redirectTo });
    } catch (err) {
      toast.error(
        err instanceof Error
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
    <div className="space-y-2">
      {showTwitter ? (
        <Button
          type="button"
          variant="outline"
          className="w-full h-10"
          disabled={pending !== null}
          onClick={() => void start('twitter')}
        >
          {pending === 'twitter' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <span className="mr-2 font-bold text-sm">𝕏</span>
          )}
          {verb} with X
        </Button>
      ) : null}
      {showDiscord ? (
        <Button
          type="button"
          variant="outline"
          className="w-full h-10"
          disabled={pending !== null}
          onClick={() => void start('discord')}
        >
          {pending === 'discord' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded-sm bg-[#5865F2] text-caption font-bold text-white">
              D
            </span>
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
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-caption uppercase tracking-wide">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>
      <SocialAuthButtons {...props} />
    </>
  );
}
