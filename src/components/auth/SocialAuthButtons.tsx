import { Button } from '@/components/ui/button';
import { useAuthActions } from '@convex-dev/auth/react';
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
  const [pending, setPending] = useState<SocialProvider | null>(null);

  const start = async (provider: SocialProvider) => {
    setPending(provider);
    try {
      await signIn(provider, { redirectTo });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : `${provider === 'twitter' ? 'X' : 'Discord'} sign-in failed. Check OAuth env vars on Convex.`,
      );
      setPending(null);
    }
  };

  const verb = mode === 'signup' ? 'Continue' : 'Continue';

  return (
    <div className="space-y-2">
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
          <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded-sm bg-[#5865F2] text-[9px] font-bold text-white">
            D
          </span>
        )}
        {verb} with Discord
      </Button>
    </div>
  );
}
