-- Admin can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can update subscriptions (for status changes)
CREATE POLICY "Admins can update subscriptions"
ON public.subscriptions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can view all products
CREATE POLICY "Admins can view all products"
ON public.products FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can update creators (for banning/featuring)
CREATE POLICY "Admins can update creators"
ON public.creators FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can update users
CREATE POLICY "Admins can update users"  
ON public.users FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));