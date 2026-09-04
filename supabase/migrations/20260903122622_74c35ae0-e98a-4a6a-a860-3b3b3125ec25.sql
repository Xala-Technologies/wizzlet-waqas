CREATE TABLE public.saved_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_posts TO authenticated;
GRANT ALL ON public.saved_posts TO service_role;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saved posts" ON public.saved_posts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can save posts" ON public.saved_posts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unsave posts" ON public.saved_posts FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.creator_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, creator_id)
);
GRANT SELECT, INSERT, DELETE ON public.creator_bookmarks TO authenticated;
GRANT ALL ON public.creator_bookmarks TO service_role;
ALTER TABLE public.creator_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own creator bookmarks" ON public.creator_bookmarks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can bookmark creators" ON public.creator_bookmarks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can remove creator bookmarks" ON public.creator_bookmarks FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX idx_saved_posts_user ON public.saved_posts(user_id, created_at DESC);
CREATE INDEX idx_creator_bookmarks_user ON public.creator_bookmarks(user_id, created_at DESC);