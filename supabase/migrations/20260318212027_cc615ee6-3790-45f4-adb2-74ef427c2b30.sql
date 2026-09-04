-- Add fee tracking columns to subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS amount numeric NOT NULL DEFAULT 9.99,
  ADD COLUMN IF NOT EXISTS platform_fee numeric NOT NULL DEFAULT 0.999,
  ADD COLUMN IF NOT EXISTS creator_earnings numeric NOT NULL DEFAULT 8.991;

-- Create a trigger to auto-calculate fees on insert/update
CREATE OR REPLACE FUNCTION public.calculate_platform_fee()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.platform_fee := ROUND(NEW.amount * 0.10, 2);
  NEW.creator_earnings := ROUND(NEW.amount - NEW.platform_fee, 2);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calculate_platform_fee
  BEFORE INSERT OR UPDATE OF amount ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_platform_fee();

-- Backfill existing rows: set amount from creator's monthly_price
UPDATE public.subscriptions s
SET amount = COALESCE(
  (SELECT c.monthly_price FROM public.creators c WHERE c.id = s.creator_id),
  9.99
);
-- Trigger will auto-set platform_fee and creator_earnings on update