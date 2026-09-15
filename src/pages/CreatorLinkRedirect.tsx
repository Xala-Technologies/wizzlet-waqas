import { useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useParams } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Loader2 } from 'lucide-react';

/**
 * Public tracking redirect: `/go/:linkId` records a click then navigates to the destination.
 */
const CreatorLinkRedirect = () => {
  const { linkId } = useParams<{ linkId: string }>();
  const recorded = useRef(false);
  const link = useQuery(
    api.creators.growth.getLinkPublic,
    linkId ? { linkId: linkId as Id<'creatorLinks'> } : 'skip',
  );
  const recordClick = useMutation(api.creators.growth.recordLinkClick);

  useEffect(() => {
    if (!linkId || link === undefined) return;
    if (link === null) return;
    if (recorded.current) return;
    recorded.current = true;
    void recordClick({ linkId: linkId as Id<'creatorLinks'> })
      .catch(() => {
        /* still redirect even if click write fails */
      })
      .finally(() => {
        window.location.replace(link.url);
      });
  }, [linkId, link, recordClick]);

  if (link === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">This tracking link was not found.</p>
      </div>
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
