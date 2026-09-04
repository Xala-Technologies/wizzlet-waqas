
-- Drop existing tables (order matters due to foreign keys)
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop old trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Users table (replaces profiles for basic user info)
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Creators table (separate creator-specific data)
CREATE TABLE public.creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username text UNIQUE,
  display_name text,
  bio text,
  avatar_url text,
  banner_url text,
  monthly_price numeric DEFAULT 9.99,
  stripe_account_id text,
  is_published boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Posts table
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text,
  is_premium boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Analytics events table
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- USERS policies
CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert own record" ON public.users FOR INSERT WITH CHECK (auth.uid() = auth_id);
CREATE POLICY "Users can update own record" ON public.users FOR UPDATE USING (auth.uid() = auth_id);

-- CREATORS policies
CREATE POLICY "Creators are viewable by everyone" ON public.creators FOR SELECT USING (true);
CREATE POLICY "Users can create creator profile" ON public.creators FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = creators.user_id AND users.auth_id = auth.uid())
);
CREATE POLICY "Creators can update own profile" ON public.creators FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = creators.user_id AND users.auth_id = auth.uid())
);

-- POSTS policies
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Creators can create posts" ON public.posts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.creators c JOIN public.users u ON u.id = c.user_id WHERE c.id = posts.creator_id AND u.auth_id = auth.uid())
);
CREATE POLICY "Creators can update own posts" ON public.posts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.creators c JOIN public.users u ON u.id = c.user_id WHERE c.id = posts.creator_id AND u.auth_id = auth.uid())
);
CREATE POLICY "Creators can delete own posts" ON public.posts FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.creators c JOIN public.users u ON u.id = c.user_id WHERE c.id = posts.creator_id AND u.auth_id = auth.uid())
);

-- SUBSCRIPTIONS policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = subscriptions.user_id AND users.auth_id = auth.uid())
);
CREATE POLICY "Creators can view their subscribers" ON public.subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.creators c JOIN public.users u ON u.id = c.user_id WHERE c.id = subscriptions.creator_id AND u.auth_id = auth.uid())
);
CREATE POLICY "Users can create subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = subscriptions.user_id AND users.auth_id = auth.uid())
);

-- ANALYTICS policies
CREATE POLICY "Creators can view own analytics" ON public.analytics_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.creators c JOIN public.users u ON u.id = c.user_id WHERE c.id = analytics_events.creator_id AND u.auth_id = auth.uid())
);
CREATE POLICY "Admins can view all analytics" ON public.analytics_events FOR SELECT USING (
  public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Authenticated users can insert analytics" ON public.analytics_events FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger: auto-create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Index for common queries
CREATE INDEX idx_creators_username ON public.creators(username);
CREATE INDEX idx_posts_creator_id ON public.posts(creator_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_creator_id ON public.subscriptions(creator_id);
CREATE INDEX idx_analytics_creator_id ON public.analytics_events(creator_id);
CREATE INDEX idx_analytics_event_type ON public.analytics_events(event_type);
