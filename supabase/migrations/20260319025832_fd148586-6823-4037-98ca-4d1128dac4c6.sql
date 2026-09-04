ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS result text NOT NULL DEFAULT 'pending';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS tracking_mode text NOT NULL DEFAULT 'manual';

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'pick',
  title text NOT NULL,
  description text,
  read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);