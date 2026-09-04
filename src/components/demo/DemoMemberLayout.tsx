import { Outlet } from 'react-router-dom';
import { DemoMemberProvider } from '@/components/demo/demoMemberStore';

/** Wraps every Member demo tab so pages and sidebar share one live store. */
const DemoMemberLayout = () => (
  <DemoMemberProvider>
    <Outlet />
  </DemoMemberProvider>
);

export default DemoMemberLayout;
