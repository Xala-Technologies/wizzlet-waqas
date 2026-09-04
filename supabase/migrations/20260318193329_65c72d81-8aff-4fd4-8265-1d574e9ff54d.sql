
-- Create a function to get premium post metadata (title, date) without content
-- This allows the profile page to show locked placeholders
CREATE OR REPLACE FUNCTION public.get_creator_post_previews(p_creator_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  is_premium boolean,
  created_at timestamptz,
  content text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.title,
    p.is_premium,
    p.created_at,
    CASE
      WHEN p.is_premium = false THEN p.content
      -- Check if caller is the creator
      WHEN EXISTS (
        SELECT 1 FROM creators c JOIN users u ON u.id = c.user_id
        WHERE c.id = p.creator_id AND u.auth_id = auth.uid()
      ) THEN p.content
      -- Check if caller is an active subscriber
      WHEN EXISTS (
        SELECT 1 FROM subscriptions s JOIN users u ON u.id = s.user_id
        WHERE s.creator_id = p.creator_id AND u.auth_id = auth.uid() AND s.status = 'active'
      ) THEN p.content
      ELSE NULL
    END AS content
  FROM posts p
  WHERE p.creator_id = p_creator_id
  ORDER BY p.created_at DESC;
$$;
