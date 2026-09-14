import { Navigate } from 'react-router-dom';

/** Legacy URL — Today's Games is stacked under Discover. */
const TodaysEvents = () => <Navigate to="/discover#todays-games" replace />;

export default TodaysEvents;
