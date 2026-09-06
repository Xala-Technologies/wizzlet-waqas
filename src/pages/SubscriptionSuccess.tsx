import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { confirmStripeCheckoutSession, PAYMENTS_MODE } from '@/lib/stripe';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const creatorUsername = searchParams.get('creator');
  const sessionId = searchParams.get('session_id');
  const [confirming, setConfirming] = useState(
    () => PAYMENTS_MODE === 'stripe' && !!sessionId,
  );
  const [confirmFailed, setConfirmFailed] = useState(false);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          {confirming ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : (
            <CheckCircle className="h-8 w-8 text-primary" />
          )}
        </div>
        <h1 className="text-2xl font-bold mb-2">
          {confirming ? 'Confirming subscription…' : 'Subscription Confirmed!'}
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          {confirming
            ? 'Finishing payment confirmation. This only takes a moment.'
            : confirmFailed
              ? 'Payment may still be processing. Refresh in a minute or check billing.'
              : `You're now subscribed${creatorUsername ? ` to @${creatorUsername}` : ''}. You have full access to all premium content.`}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {creatorUsername && (
            <Link to={`/${creatorUsername}`}>
              <Button variant="hero" size="lg" disabled={confirming}>
                View Creator
              </Button>
            </Link>
          )}
          <Link to="/dashboard">
            <Button variant="outline" size="lg" disabled={confirming}>
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
