-- Tracked links
CREATE TABLE public.creator_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  slug text UNIQUE,
  clicks integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_links TO authenticated;
GRANT ALL ON public.creator_links TO service_role;
ALTER TABLE public.creator_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage own links" ON public.creator_links FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM creators c JOIN users u ON u.id = c.user_id WHERE c.id = creator_links.creator_id AND u.auth_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM creators c JOIN users u ON u.id = c.user_id WHERE c.id = creator_links.creator_id AND u.auth_id = auth.uid()));
CREATE POLICY "Admins view all links" ON public.creator_links FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_creator_links_updated_at BEFORE UPDATE ON public.creator_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Promo codes
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  discount_percent integer NOT NULL DEFAULT 10,
  max_uses integer,
  times_used integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_codes TO authenticated;
GRANT SELECT ON public.promo_codes TO anon;
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active promo codes are readable" ON public.promo_codes FOR SELECT USING (is_active = true);
CREATE POLICY "Creators manage own promo codes" ON public.promo_codes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM creators c JOIN users u ON u.id = c.user_id WHERE c.id = promo_codes.creator_id AND u.auth_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM creators c JOIN users u ON u.id = c.user_id WHERE c.id = promo_codes.creator_id AND u.auth_id = auth.uid()));
CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON public.promo_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Referrals
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  referred_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  referred_email text,
  converted boolean NOT NULL DEFAULT false,
  commission_earned numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators view own referrals" ON public.referrals FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM creators c JOIN users u ON u.id = c.user_id WHERE c.id = referrals.creator_id AND u.auth_id = auth.uid()));
CREATE POLICY "Admins manage referrals" ON public.referrals FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can record referral" ON public.referrals FOR INSERT TO authenticated WITH CHECK (true);
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Product access control
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS max_spots integer,
  ADD COLUMN IF NOT EXISTS is_limited boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_closed boolean NOT NULL DEFAULT false;

-- Payout settings
CREATE TABLE public.creator_payout_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL UNIQUE REFERENCES public.creators(id) ON DELETE CASCADE,
  method text NOT NULL DEFAULT 'bank_transfer',
  account_label text,
  schedule text NOT NULL DEFAULT 'monthly',
  minimum_payout numeric NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.creator_payout_settings TO authenticated;
GRANT ALL ON public.creator_payout_settings TO service_role;
ALTER TABLE public.creator_payout_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage own payout settings" ON public.creator_payout_settings FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM creators c JOIN users u ON u.id = c.user_id WHERE c.id = creator_payout_settings.creator_id AND u.auth_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM creators c JOIN users u ON u.id = c.user_id WHERE c.id = creator_payout_settings.creator_id AND u.auth_id = auth.uid()));
CREATE POLICY "Admins view payout settings" ON public.creator_payout_settings FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_creator_payout_settings_updated_at BEFORE UPDATE ON public.creator_payout_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Resolution cases
CREATE TABLE public.resolution_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  subject text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.resolution_cases TO authenticated;
GRANT ALL ON public.resolution_cases TO service_role;
ALTER TABLE public.resolution_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage own cases" ON public.resolution_cases FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM creators c JOIN users u ON u.id = c.user_id WHERE c.id = resolution_cases.creator_id AND u.auth_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM creators c JOIN users u ON u.id = c.user_id WHERE c.id = resolution_cases.creator_id AND u.auth_id = auth.uid()));
CREATE POLICY "Admins manage all cases" ON public.resolution_cases FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_resolution_cases_updated_at BEFORE UPDATE ON public.resolution_cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.resolution_case_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.resolution_cases(id) ON DELETE CASCADE,
  sender_role text NOT NULL DEFAULT 'creator',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.resolution_case_messages TO authenticated;
GRANT ALL ON public.resolution_case_messages TO service_role;
ALTER TABLE public.resolution_case_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Case participants read messages" ON public.resolution_case_messages FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR EXISTS (
  SELECT 1 FROM resolution_cases rc JOIN creators c ON c.id = rc.creator_id JOIN users u ON u.id = c.user_id
  WHERE rc.id = resolution_case_messages.case_id AND u.auth_id = auth.uid()));
CREATE POLICY "Case participants write messages" ON public.resolution_case_messages FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR EXISTS (
  SELECT 1 FROM resolution_cases rc JOIN creators c ON c.id = rc.creator_id JOIN users u ON u.id = c.user_id
  WHERE rc.id = resolution_case_messages.case_id AND u.auth_id = auth.uid()));

-- Admin <-> creator support / growth messages
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  sender_role text NOT NULL DEFAULT 'admin',
  channel text NOT NULL DEFAULT 'support',
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage support messages" ON public.support_messages FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Creators read own support messages" ON public.support_messages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM creators c JOIN users u ON u.id = c.user_id WHERE c.id = support_messages.creator_id AND u.auth_id = auth.uid()));
CREATE POLICY "Creators reply to own support messages" ON public.support_messages FOR INSERT TO authenticated
WITH CHECK (sender_role = 'creator' AND EXISTS (SELECT 1 FROM creators c JOIN users u ON u.id = c.user_id WHERE c.id = support_messages.creator_id AND u.auth_id = auth.uid()));
CREATE POLICY "Creators mark own messages read" ON public.support_messages FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM creators c JOIN users u ON u.id = c.user_id WHERE c.id = support_messages.creator_id AND u.auth_id = auth.uid()));

CREATE INDEX idx_support_messages_creator ON public.support_messages(creator_id, created_at DESC);
CREATE INDEX idx_resolution_cases_creator ON public.resolution_cases(creator_id, created_at DESC);
CREATE INDEX idx_creator_links_creator ON public.creator_links(creator_id);
CREATE INDEX idx_promo_codes_creator ON public.promo_codes(creator_id);
CREATE INDEX idx_referrals_creator ON public.referrals(creator_id);