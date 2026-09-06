import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DevModeBanner } from "@/components/dev/DevModeBanner";
import Index from "./pages/Index";
import Login from "./pages/Login";
import DemoCreatorDashboard from "./pages/DemoCreatorDashboard";
import DemoAdminLayout from "./components/dashboard/DemoAdminLayout";
import DemoAdminDashboard from "./pages/DemoAdminDashboard";
import DemoAdminCreators from "./pages/DemoAdminCreators";
import DemoAdminUsers from "./pages/DemoAdminUsers";
import DemoAdminTransactions from "./pages/DemoAdminTransactions";
import DemoAdminFees from "./pages/DemoAdminFees";
import DemoAdminSettings from "./pages/DemoAdminSettings";
import DemoMemberLayout from "./components/demo/DemoMemberLayout";
import DemoMemberDashboard from "./pages/DemoMemberDashboard";
import DemoMemberSubscriptionsBilling from "./pages/DemoMemberSubscriptions";
import DemoMemberActivity from "./pages/DemoMemberActivity";
import DemoMemberDiscover from "./pages/DemoMemberDiscover";
import DemoMemberSettings from "./pages/DemoMemberSettings";
import DemoMemberResults from "./pages/DemoMemberResults";
import DemoMemberSaved from "./pages/DemoMemberSaved";
import DemoMemberNotifications from "./pages/DemoMemberNotifications";
import Signup from "./pages/Signup";
import SelectRole from "./pages/SelectRole";
import Dashboard from "./pages/Dashboard";
import CustomerResults from "./pages/CustomerResults";
import CustomerSubscriptionsBilling from "./pages/CustomerSubscriptionsBilling";
import CustomerSaved from "./pages/CustomerSaved";
import CustomerNotifications from "./pages/CustomerNotifications";
import CustomerDiscover from "./pages/CustomerDiscover";
import CustomerSettings from "./pages/CustomerSettings";
import CustomerActivity from "./pages/CustomerActivity";
import CreatorDashboard from "./pages/CreatorDashboard";
import CreatorPosts from "./pages/CreatorPosts";
import CreatorProducts from "./pages/CreatorProducts";
import CreatorSubscribers from "./pages/CreatorSubscribers";
import CreatorPromo from "./pages/CreatorPromo";
import CreatorPersonalGrowth from "./pages/CreatorPersonalGrowth";
import CreatorResolutionCase from "./pages/CreatorResolutionCase";
import CreatorSmartPricing from "./pages/CreatorSmartPricing";
import CreatorAccessControl from "./pages/CreatorAccessControl";
import CreatorPerformanceTracker from "./pages/CreatorPerformanceTracker";
import CreatorMessages from "./pages/CreatorMessages";
import CreatorLinks from "./pages/CreatorLinks";
import CreatorReferrals from "./pages/CreatorReferrals";
import CreatorEarnings from "./pages/CreatorEarnings";
import CreatorPayouts from "./pages/CreatorPayouts";
import CreatorSettings from "./pages/CreatorSettings";
import CreatorOnboarding from "./pages/CreatorOnboarding";
import CreatorProfile from "./pages/CreatorProfile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCreators from "./pages/AdminCreators";
import AdminUsers from "./pages/AdminUsers";
import AdminCustomers from "./pages/AdminCustomers";
import AdminTransactions from "./pages/AdminTransactions";
import AdminFees from "./pages/AdminFees";
import AdminCreatorMessaging from "./pages/AdminCreatorMessaging";
import AdminCustomerEmail from "./pages/AdminCustomerEmail";
import AdminGrowthManagerInbox from "./pages/AdminGrowthManagerInbox";
import AdminResolutionCases from "./pages/AdminResolutionCases";
import AdminSettings from "./pages/AdminSettings";
import AdminPayouts from "./pages/AdminPayouts";
import AdminFinance from "./pages/AdminFinance";
import AdminAlerts from "./pages/AdminAlerts";
import AdminReports from "./pages/AdminReports";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionCancel from "./pages/SubscriptionCancel";
import Network from "./pages/Network";
import Creators from "./pages/Creators";
import TodaysEvents from "./pages/TodaysEvents";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import Discover from "./pages/Discover";
import TopCreators from "./pages/TopCreators";
import Community from "./pages/Community";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ConvexAppProvider } from "./integrations/convex/ConvexAppProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <ConvexAppProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <DevModeBanner />
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/network" element={<Network />} />
            <Route path="/creators" element={<Creators />} />
            <Route path="/todays-events" element={<TodaysEvents />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/top-creators" element={<TopCreators />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/community" element={<Community />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/select-role" element={<SelectRole />} />

            {/* Demo routes — no auth required */}
            <Route path="/demo/creator" element={<DemoCreatorDashboard />} />
            <Route path="/demo/admin" element={<DemoAdminLayout />}>
              <Route index element={<DemoAdminDashboard />} />
              <Route path="creators" element={<DemoAdminCreators />} />
              <Route path="users" element={<DemoAdminUsers />} />
              <Route path="transactions" element={<DemoAdminTransactions />} />
              <Route path="fees" element={<DemoAdminFees />} />
              <Route path="settings" element={<DemoAdminSettings />} />
            </Route>
            <Route path="/demo/member" element={<DemoMemberLayout />}>
              <Route index element={<DemoMemberDashboard />} />
              <Route path="results" element={<DemoMemberResults />} />
              <Route path="subscriptions-billing" element={<DemoMemberSubscriptionsBilling />} />
              <Route path="saved" element={<DemoMemberSaved />} />
              <Route path="notifications" element={<DemoMemberNotifications />} />
              <Route path="discover" element={<DemoMemberDiscover />} />
              <Route path="activity" element={<DemoMemberActivity />} />
              <Route path="settings" element={<DemoMemberSettings />} />
            </Route>

            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['subscriber']}><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/results" element={<ProtectedRoute allowedRoles={['subscriber']}><CustomerResults /></ProtectedRoute>} />
            <Route path="/dashboard/subscriptions-billing" element={<ProtectedRoute allowedRoles={['subscriber']}><CustomerSubscriptionsBilling /></ProtectedRoute>} />
            <Route path="/dashboard/saved" element={<ProtectedRoute allowedRoles={['subscriber']}><CustomerSaved /></ProtectedRoute>} />
            <Route path="/dashboard/notifications" element={<ProtectedRoute allowedRoles={['subscriber']}><CustomerNotifications /></ProtectedRoute>} />
            <Route path="/dashboard/discover" element={<ProtectedRoute allowedRoles={['subscriber']}><CustomerDiscover /></ProtectedRoute>} />
            <Route path="/dashboard/activity" element={<ProtectedRoute allowedRoles={['subscriber']}><CustomerActivity /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute allowedRoles={['subscriber']}><CustomerSettings /></ProtectedRoute>} />
            <Route path="/creator" element={<ProtectedRoute allowedRoles={['creator']}><CreatorDashboard /></ProtectedRoute>} />
            <Route path="/creator/posts" element={<ProtectedRoute allowedRoles={['creator']}><CreatorPosts /></ProtectedRoute>} />
            <Route path="/creator/products" element={<ProtectedRoute allowedRoles={['creator']}><CreatorProducts /></ProtectedRoute>} />
            <Route path="/creator/subscribers" element={<ProtectedRoute allowedRoles={['creator']}><CreatorSubscribers /></ProtectedRoute>} />
            <Route path="/creator/promo" element={<ProtectedRoute allowedRoles={['creator']}><CreatorPromo /></ProtectedRoute>} />
            <Route path="/creator/personal-growth-manager" element={<ProtectedRoute allowedRoles={['creator']}><CreatorPersonalGrowth /></ProtectedRoute>} />
            <Route path="/creator/resolution-case" element={<ProtectedRoute allowedRoles={['creator']}><CreatorResolutionCase /></ProtectedRoute>} />
            <Route path="/creator/smart-pricing" element={<ProtectedRoute allowedRoles={['creator']}><CreatorSmartPricing /></ProtectedRoute>} />
            <Route path="/creator/access-control" element={<ProtectedRoute allowedRoles={['creator']}><CreatorAccessControl /></ProtectedRoute>} />
            <Route path="/creator/performance-tracker" element={<ProtectedRoute allowedRoles={['creator']}><CreatorPerformanceTracker /></ProtectedRoute>} />
            <Route path="/creator/messages" element={<ProtectedRoute allowedRoles={['creator']}><CreatorMessages /></ProtectedRoute>} />
            <Route path="/creator/links" element={<ProtectedRoute allowedRoles={['creator']}><CreatorLinks /></ProtectedRoute>} />
            <Route path="/creator/referrals" element={<ProtectedRoute allowedRoles={['creator']}><CreatorReferrals /></ProtectedRoute>} />
            <Route path="/creator/earnings" element={<ProtectedRoute allowedRoles={['creator']}><CreatorEarnings /></ProtectedRoute>} />
            <Route path="/creator/payouts" element={<ProtectedRoute allowedRoles={['creator']}><CreatorPayouts /></ProtectedRoute>} />
            <Route path="/creator/settings" element={<ProtectedRoute allowedRoles={['creator']}><CreatorSettings /></ProtectedRoute>} />
            <Route path="/creator/onboarding" element={<ProtectedRoute allowedRoles={['creator']}><CreatorOnboarding /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/creators" element={<ProtectedRoute allowedRoles={['admin']}><AdminCreators /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/customers" element={<ProtectedRoute allowedRoles={['admin']}><AdminCustomers /></ProtectedRoute>} />
            <Route path="/admin/finance" element={<ProtectedRoute allowedRoles={['admin']}><AdminFinance /></ProtectedRoute>} />
            <Route path="/admin/transactions" element={<ProtectedRoute allowedRoles={['admin']}><AdminTransactions /></ProtectedRoute>} />
            <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={['admin']}><AdminFees /></ProtectedRoute>} />
            <Route path="/admin/creator-messaging" element={<ProtectedRoute allowedRoles={['admin']}><AdminCreatorMessaging /></ProtectedRoute>} />
            <Route path="/admin/customer-email" element={<ProtectedRoute allowedRoles={['admin']}><AdminCustomerEmail /></ProtectedRoute>} />
            <Route path="/admin/growth-manager-inbox" element={<ProtectedRoute allowedRoles={['admin']}><AdminGrowthManagerInbox /></ProtectedRoute>} />
            <Route path="/admin/resolution-cases" element={<ProtectedRoute allowedRoles={['admin']}><AdminResolutionCases /></ProtectedRoute>} />
            <Route path="/admin/payouts" element={<ProtectedRoute allowedRoles={['admin']}><AdminPayouts /></ProtectedRoute>} />
            <Route path="/admin/alerts" element={<ProtectedRoute allowedRoles={['admin']}><AdminAlerts /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
            <Route path="/subscription/success" element={<SubscriptionSuccess />} />
            <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
            <Route path="/:username" element={<CreatorProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
    </ConvexAppProvider>
  </ErrorBoundary>
);

export default App;
