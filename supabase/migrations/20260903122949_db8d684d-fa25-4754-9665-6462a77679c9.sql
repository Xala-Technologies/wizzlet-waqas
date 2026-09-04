ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS notification_prefs jsonb NOT NULL
DEFAULT '{"new_posts": true, "price_changes": true, "promotions": true}'::jsonb;