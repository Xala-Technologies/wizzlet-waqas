import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAction, useMutation, useQuery } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { confirmStripeCheckoutSession, PAYMENTS_MODE } from '@/lib/stripe';
import { creatorProfilePath } from '@/lib/creatorProfilePath';
import { api } from '../../convex/_generated/api';
import { authCallbackUrl, ensureCanonicalAuthOrigin } from '@/lib/authSession';
import { storeReturnTo } from '@/lib/safeReturnPath';
import { toast } from 'sonner';

function DiscordMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.1.1 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.1 16.1 0 0 0-4.8 0c-.14-.34-.37-.76-.54-1.09A.1.1 0 0 0 8.99 4c-1.5.26-2.93.71-4.27 1.33a.09.09 0 0 0-.04.03C2.43 9.07 1.8 12.7 2.12 16.28c0 .02 0 .04.02.05 1.8 1.32 3.53 2.12 5.24 2.65a.1.1 0 0 0 .12-.04c.4-.55.76-1.13 1.07-1.74a.1.1 0 0 0-.05-.13 10.7 10.7 0 0 1-1.52-.73.1.1 0 0 1-.02-.16c.1-.08.2-.16.3-.24a.1.1 0 0 1 .1-.01c3.19 1.46 6.64 1.46 9.8 0a.1.1 0 0 1 .11.01c.1.08.2.16.3.24a.1.1 0 0 1-.01.16c-.49.28-.99.52-1.53.73a.1.1 0 0 0-.05.13c.31.61.67 1.19 1.07 1.74a.1.1 0 0 0 .12.04c1.72-.53 3.45-1.33 5.25-2.65a.1.1 0 0 0 .02-.05c.38-4.14-.64-7.74-2.7-10.92a.07.07 0 0 0-.03-.03ZM8.52 14.33c-.96 0-1.75-.88-1.75-1.96s.77-1.96 1.75-1.96 1.77.88 1.75 1.96c0 1.08-.79 1.96-1.75 1.96Zm6.97 0c-.96 0-1.75-.88-1.75-1.96s.77-1.96 1.75-1.96 1.77.88 1.75 1.96c0 1.08-.78 1.96-1.75 1.96Z"
      />
    </svg>
  );
}

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const creatorUsername = searchParams.get('creator');
  const sessionId = searchParams.get('session_id');
  const { signIn } = useAuthActions();
  const [confirming, setConfirming] = useState(
    () => PAYMENTS_MODE === 'stripe' && !!sessionId,
  );
  const [confirmFailed, setConfirmFailed] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [later, setLater] = useState(false);

  const access = useQuery(
    api.discord.queries.memberAccess,
    creatorUsername ? { creatorUsername } : 'skip',
  );
  const createInvite = useAction(api.discord.roles.createMemberInvite);
  const retryAccess = useMutation(api.discord.mutations.retryMyAccess);

  useEffect(() => {
    if (PAYMENTS_MODE !== 'stripe' || !sessionId) return;
    let cancelled = false;
    void (async () => {
      const ok = await confirmStripeCheckoutSession(sessionId);
      if (cancelled) return;
      setConfirming(false);
      if (!ok) setConfirmFailed(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const discord = access?.includesDiscord ? access : null;

  const joinDiscord = async () => {
    if (!discord) return;
    setInviteBusy(true);
    try {
      let url = discord.inviteUrl;
      if (!url) {
        url = await createInvite({ creatorId: discord.creatorId });
      }
      await retryAccess({ creatorId: discord.creatorId });
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Invite is not ready yet. Try again in a moment.');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not open Discord');
    } finally {
      setInviteBusy(false);
    }
  };

  const connectDiscord = async () => {
    try {
      if (ensureCanonicalAuthOrigin()) return;
      const returnTo = `${window.location.pathname}${window.location.search}`;
      storeReturnTo(returnTo);
      await signIn('discord', { redirectTo: authCallbackUrl('/auth/callback') });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Discord sign-in is not configured');
    }
  };

  const showDiscordCard = Boolean(discord) && !later && !confirming;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
          {confirming ? (
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          ) : (
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          )}
        </div>
        <h1 className="text-2xl font-bold">
          {confirming
            ? 'Confirming subscription…'
            : confirmFailed
              ? 'Subscription confirmed'
              : showDiscordCard
                ? 'Subscription successful!'
                : 'Subscription confirmed'}
        </h1>
        <p className="mb-8 mt-2 text-sm text-muted-foreground">
          {confirming
            ? 'Finishing payment confirmation. This only takes a moment.'
            : confirmFailed
              ? 'Payment may still be processing. Refresh in a minute or check Subscriptions.'
              : showDiscordCard
                ? `You now have access${discord?.productName ? ` to ${discord.productName}` : ''}.`
                : `You're subscribed${creatorUsername ? ` to @${creatorUsername}` : ''}. Open Subscriptions to see recent posts and manage access.`}
        </p>

        {showDiscordCard ? (
          <div className="rounded-2xl border border-border bg-card p-5 text-left shadow-[var(--shadow-card)]">
            <p className="flex items-center gap-2 text-base font-extrabold text-foreground">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5865F2] text-white">
                <DiscordMark className="h-5 w-5" />
              </span>
              Join our Discord
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Click the button below to join {discord?.guildName ?? 'the server'} and get access to
              private channels.
            </p>
            {!discord?.hasDiscordId ? (
              <Button
                type="button"
                variant="outline"
                className="mt-4 h-11 w-full rounded-xl"
                onClick={() => void connectDiscord()}
              >
                Connect Discord account
              </Button>
            ) : null}
            <Button
              type="button"
              className="mt-3 h-12 w-full rounded-xl bg-[#5865F2] hover:bg-[#4752c4]"
              disabled={inviteBusy}
              onClick={() => void joinDiscord()}
            >
              {inviteBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Join Discord
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="mt-2 h-11 w-full rounded-xl"
              onClick={() => setLater(true)}
            >
              I&apos;ll do this later
            </Button>
          </div>
        ) : (
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="hero" size="lg" disabled={confirming} asChild>
              <Link to="/dashboard/subscriptions-billing">Go to Subscriptions</Link>
            </Button>
            <Button variant="outline" size="lg" disabled={confirming} asChild>
              <Link to="/dashboard">View Dashboard</Link>
            </Button>
          </div>
        )}

        {creatorUsername ? (
          <div className="mt-4">
            <Button variant="ghost" size="lg" disabled={confirming} asChild>
              <Link to={creatorProfilePath(creatorUsername)}>View creator profile</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
