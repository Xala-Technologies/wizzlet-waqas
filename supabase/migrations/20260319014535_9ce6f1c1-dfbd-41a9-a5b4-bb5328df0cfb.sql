
ALTER TABLE public.pick_tracker
  ADD COLUMN IF NOT EXISTS eu_odds numeric,
  ADD COLUMN IF NOT EXISTS us_odds text;

-- Migrate existing odds data to us_odds
UPDATE public.pick_tracker SET us_odds = odds WHERE odds IS NOT NULL AND us_odds IS NULL;
