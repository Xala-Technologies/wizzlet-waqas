CREATE POLICY "Users can view own analytics events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users u
  WHERE u.id = analytics_events.user_id AND u.auth_id = auth.uid()
));