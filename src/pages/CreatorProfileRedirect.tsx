import { Navigate, useParams } from 'react-router-dom';
import { creatorProfilePath } from '@/lib/creatorProfilePath';

/** Redirects legacy `/c/:username` links to the live profile route. */
export default function CreatorProfileRedirect() {
  const { username } = useParams();
  if (!username) return <Navigate to="/creators" replace />;
  return <Navigate to={creatorProfilePath(username)} replace />;
}
