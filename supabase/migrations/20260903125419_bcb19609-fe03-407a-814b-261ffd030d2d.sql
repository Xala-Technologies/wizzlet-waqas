CREATE TABLE public.payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  method text NOT NULL DEFAULT 'bank_transfer',
  reference text,
  period_start date,
  period_end date,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payouts_creator ON public.payouts(creator_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);

GRANT SELECT, INSERT, UPDATE ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all payouts" ON public.payouts
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create payouts" ON public.payouts
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payouts" ON public.payouts
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Creators can view own payouts" ON public.payouts
FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM public.creators c JOIN public.users u ON u.id = c.user_id
  WHERE c.id = payouts.creator_id AND u.auth_id = auth.uid()
));

CREATE TRIGGER update_payouts_updated_at
BEFORE UPDATE ON public.payouts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();