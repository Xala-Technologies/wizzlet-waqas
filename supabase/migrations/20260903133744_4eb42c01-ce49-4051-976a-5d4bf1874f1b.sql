CREATE OR REPLACE FUNCTION public.calculate_platform_fee()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  creator_created_at timestamptz;
  days_since_signup integer;
  fee_rate numeric;
  s_intro numeric := 5;
  s_standard numeric := 10;
  s_days integer := 30;
BEGIN
  SELECT ps.intro_fee_percent, ps.standard_fee_percent, ps.intro_period_days
    INTO s_intro, s_standard, s_days
  FROM public.platform_settings ps
  WHERE ps.id = true;

  s_intro := COALESCE(s_intro, 5);
  s_standard := COALESCE(s_standard, 10);
  s_days := COALESCE(s_days, 30);

  SELECT c.created_at INTO creator_created_at
  FROM public.creators c
  WHERE c.id = NEW.creator_id;

  days_since_signup := EXTRACT(DAY FROM (now() - COALESCE(creator_created_at, now())));

  IF days_since_signup < s_days THEN
    fee_rate := s_intro / 100.0;
  ELSE
    fee_rate := s_standard / 100.0;
  END IF;

  NEW.fee_percentage := ROUND(fee_rate * 100, 1);
  NEW.platform_fee := ROUND(NEW.amount * fee_rate, 2);
  NEW.creator_earnings := ROUND(NEW.amount - NEW.platform_fee, 2);
  RETURN NEW;
END;
$function$;