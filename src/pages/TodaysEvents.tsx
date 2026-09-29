import { Navigate } from 'react-router-dom';

/** Legacy route — games live on the home page, Discover is creators-only. */
const TodaysEvents = () => <Navigate to="/" replace />;

export default TodaysEvents;
