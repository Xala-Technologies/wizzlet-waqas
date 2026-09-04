
-- Drop the overly permissive SELECT policy on posts
DROP POLICY "Posts are viewable by everyone" ON public.posts;

-- Free posts: visible to everyone
CREATE POLICY "Free posts are viewable by everyone"
ON public.posts FOR SELECT
USING (is_premium = false);

-- Premium posts: visible to the creator themselves
CREATE POLICY "Creators can view own premium posts"
ON public.posts FOR SELECT
USING (
  is_premium = true
  AND EXISTS (
    SELECT 1 FROM public.creators c
    JOIN public.users u ON u.id = c.user_id
    WHERE c.id = posts.creator_id AND u.auth_id = auth.uid()
  )
);

-- Premium posts: visible to active subscribers
CREATE POLICY "Subscribers can view premium posts"
ON public.posts FOR SELECT
TO authenticated
USING (
  is_premium = true
  AND EXISTS (
    SELECT 1 FROM public.subscriptions s
    JOIN public.users u ON u.id = s.user_id
    WHERE s.creator_id = posts.creator_id
      AND u.auth_id = auth.uid()
      AND s.status = 'active'
  )
);
