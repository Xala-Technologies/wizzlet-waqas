
-- Add fee_percentage column to subscriptions
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS fee_percentage numeric NOT NULL DEFAULT 10;

-- Replace the calculate_platform_fee trigger function with age-aware logic
CREATE OR REPLACE FUNCTION public.calculate_platform_fee()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  creator_created_at timestamptz;
  days_since_signup integer;
  fee_rate numeric;
BEGIN
  -- Get creator registration date
  SELECT c.created_at INTO creator_created_at
  FROM creators c
  WHERE c.id = NEW.creator_id;

  -- Calculate days since signup
  days_since_signup := EXTRACT(DAY FROM (now() - COALESCE(creator_created_at, now())));

  -- Apply tiered fee: 5% for first 30 days, 10% after
  IF days_since_signup < 30 THEN
    fee_rate := 0.05;
  ELSE
    fee_rate := 0.10;
  END IF;

  NEW.fee_percentage := ROUND(fee_rate * 100, 1);
  NEW.platform_fee := ROUND(NEW.amount * fee_rate, 2);
  NEW.creator_earnings := ROUND(NEW.amount - NEW.platform_fee, 2);
  RETURN NEW;
END;
$function$;

-- Recreate trigger
DROP TRIGGER IF EXISTS trg_calculate_platform_fee ON public.subscriptions;
CREATE TRIGGER trg_calculate_platform_fee
  BEFORE INSERT OR UPDATE OF amount ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_platform_fee();
