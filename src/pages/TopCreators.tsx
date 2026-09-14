import { Navigate } from 'react-router-dom';

/**
 * Legacy stub. Activity ranking lives on Discover (Most active).
 * Keeps old bookmarks from landing on an empty placeholder.
 */
const TopCreators = () => <Navigate to="/discover" replace />;

export default TopCreators;
