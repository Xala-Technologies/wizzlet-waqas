REVOKE SELECT ON public.platform_settings FROM anon;

DROP POLICY IF EXISTS "Platform settings are readable by everyone" ON public.platform_settings;

CREATE POLICY "Signed-in users can read platform settings"
  ON public.platform_settings FOR SELECT TO authenticated USING (true);