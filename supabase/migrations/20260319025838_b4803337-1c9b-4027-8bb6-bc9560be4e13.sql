DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NOT NULL);