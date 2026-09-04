REVOKE SELECT ON public.analytics_events FROM anon;
REVOKE SELECT ON public.creator_bookmarks FROM anon;
REVOKE SELECT ON public.notifications FROM anon;
REVOKE SELECT ON public.pick_tracker FROM anon;
REVOKE SELECT ON public.saved_posts FROM anon;
REVOKE SELECT ON public.subscriptions FROM anon;
REVOKE SELECT ON public.user_roles FROM anon;
REVOKE SELECT ON public.users FROM anon;

REVOKE INSERT, UPDATE, DELETE ON public.analytics_events FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.creator_bookmarks FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.notifications FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.pick_tracker FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.saved_posts FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.subscriptions FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.users FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.creators FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.posts FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.products FROM anon;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.calculate_platform_fee() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;