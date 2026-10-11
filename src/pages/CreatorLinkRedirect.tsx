import { useEffect, useState } from 'react';
import { useConvex, useMutation } from 'convex/react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { sanitizeCreatorLinkId, storeCreatorLinkId } from '@/lib/creatorLinkHandoff';
import { Loader2 } from 'lucide-react';

/**
 * Public tracking redirect: `/go/:linkId` records a click then navigates to the destination.
 * Stashes the link id so a later Checkout on the same browser can attribute a paid conversion.
 */
const CreatorLinkRedirect = () => {
  const { linkId } = useParams<{ linkId: string }>();
  const convex = useConvex();
  const [status, setStatus] = useState<'loading' | 'not-found' | 'error'>('loading');
  const recordClick = useMutation(api.creators.growth.recordLinkClick);

  useEffect(() => {
    const safeId = sanitizeCreatorLinkId(linkId);
    if (!safeId) { setStatus('not-found'); return; }
    let cancelled = false;
    setStatus('loading');
    void (async () => {
      try {
        // A route segment is untrusted. Catch validation/network failures here
        // instead of allowing a reactive query to crash the whole application.
        const link = await convex.query(api.creators.growth.getLinkPublic, {
          linkId: safeId as Id<'creatorLinks'>,
        });
        if (cancelled) return;
        if (!link) { setStatus('not-found'); return; }
        storeCreatorLinkId(safeId);
        await recordClick({ linkId: safeId as Id<'creatorLinks'> }).catch(() => undefined);
        if (!cancelled) window.location.replace(link.url);
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [linkId, convex, recordClick]);

  if (status !== 'loading') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-xl font-semibold">Tracking link unavailable</h1>
        <p className="text-sm text-muted-foreground">{status === 'not-found'
          ? 'This tracking link was not found.'
          : 'This tracking link could not be loaded. Please try again later.'}</p>
        <Link to="/discover" className="underline">Browse creators</Link>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Redirecting…</p>
    </div>
  );
};

export default CreatorLinkRedirect;
