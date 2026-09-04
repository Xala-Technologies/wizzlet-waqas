
-- Fix: tighten analytics insert to require matching user
DROP POLICY "Authenticated users can insert analytics" ON public.analytics_events;
CREATE POLICY "Users can insert own analytics" ON public.analytics_events FOR INSERT TO authenticated
WITH CHECK (
  user_id IS NULL OR EXISTS (SELECT 1 FROM public.users WHERE users.id = analytics_events.user_id AND users.auth_id = auth.uid())
);
