
-- Add discord columns to users table for future automation
ALTER TABLE public.users ADD COLUMN discord_id text UNIQUE;
ALTER TABLE public.users ADD COLUMN discord_username text;

-- Add discord columns to creators for role automation
ALTER TABLE public.creators ADD COLUMN discord_server_id text;
ALTER TABLE public.creators ADD COLUMN discord_role_id text;
