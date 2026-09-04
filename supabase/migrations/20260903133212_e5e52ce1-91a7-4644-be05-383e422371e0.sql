-- 1. Platform settings (singleton)
CREATE TABLE public.platform_settings (
  id boolean PRIMARY KEY DEFAULT true,
  standard_fee_percent numeric NOT NULL DEFAULT 10,
  intro_fee_percent numeric NOT NULL DEFAULT 5,
  intro_period_days integer NOT NULL DEFAULT 30,
  platform_name text NOT NULL DEFAULT 'Wizzlet',
  support_email text NOT NULL DEFAULT 'support@wizzlet.com',
  tagline text NOT NULL DEFAULT 'The premium creator platform',
  min_payout_amount numeric NOT NULL DEFAULT 50,
  payout_schedule text NOT NULL DEFAULT 'monthly',
  creator_messaging_enabled boolean NOT NULL DEFAULT true,
  growth_manager_enabled boolean NOT NULL DEFAULT true,
  auto_approve_creators boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_settings_singleton CHECK (id)
);

GRANT SELECT ON public.platform_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform settings are readable by everyone"
  ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert platform settings"
  ON public.platform_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update platform settings"
  ON public.platform_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.platform_settings (id) VALUES (true) ON CONFLICT DO NOTHING;

-- 2. Creator messaging switch
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS messaging_enabled boolean NOT NULL DEFAULT true;

-- 3. Creator <-> subscriber direct messages
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_role text NOT NULL DEFAULT 'subscriber',
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_direct_messages_creator ON public.direct_messages(creator_id, created_at DESC);
CREATE INDEX idx_direct_messages_subscriber ON public.direct_messages(subscriber_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view direct messages"
  ON public.direct_messages FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = direct_messages.subscriber_id AND u.auth_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.creators c JOIN public.users u ON u.id = c.user_id
      WHERE c.id = direct_messages.creator_id AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send direct messages"
  ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (
    (sender_role = 'subscriber' AND EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = direct_messages.subscriber_id AND u.auth_id = auth.uid()
    ))
    OR (sender_role = 'creator' AND EXISTS (
      SELECT 1 FROM public.creators c JOIN public.users u ON u.id = c.user_id
      WHERE c.id = direct_messages.creator_id AND u.auth_id = auth.uid()
    ))
  );

CREATE POLICY "Participants can mark direct messages read"
  ON public.direct_messages FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = direct_messages.subscriber_id AND u.auth_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.creators c JOIN public.users u ON u.id = c.user_id
      WHERE c.id = direct_messages.creator_id AND u.auth_id = auth.uid()
    )
  );

-- 4. Customer email campaigns
CREATE TABLE public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'all',
  recipients integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'sent',
  sent_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_campaigns_created ON public.email_campaigns(created_at DESC);

GRANT SELECT, INSERT ON public.email_campaigns TO authenticated;
GRANT ALL ON public.email_campaigns TO service_role;

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email campaigns"
  ON public.email_campaigns FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create email campaigns"
  ON public.email_campaigns FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));