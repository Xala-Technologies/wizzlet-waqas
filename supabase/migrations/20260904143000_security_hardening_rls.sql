-- Standards Hardening Pass: close privilege-escalation and free-premium paths.
-- Admin roles and paid subscriptions must only be written by trusted server paths.

-- ---------------------------------------------------------------------------
-- 1. user_roles: allow self-assign of creator/subscriber only (never admin)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

CREATE POLICY "Users can insert own non-admin role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('creator'::public.app_role, 'subscriber'::public.app_role)
);

-- ---------------------------------------------------------------------------
-- 2. subscriptions: remove client INSERT (service role / webhook / sandbox only)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create subscriptions" ON public.subscriptions;

-- ---------------------------------------------------------------------------
-- 3. notifications: admins may insert; no arbitrary authenticated spam
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

CREATE POLICY "Admins can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ---------------------------------------------------------------------------
-- 4. referrals: bind insert to caller; no client-set commission/converted
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can record referral" ON public.referrals;

CREATE POLICY "Users can record own referral"
ON public.referrals
FOR INSERT
TO authenticated
WITH CHECK (
  commission_earned = 0
  AND converted = false
  AND (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = referrals.referred_user_id
        AND u.auth_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.creators c
      JOIN public.users u ON u.id = c.user_id
      WHERE c.id = referrals.creator_id
        AND u.auth_id = auth.uid()
    )
  )
);

-- ---------------------------------------------------------------------------
-- 5. users SELECT: own row + admin + creators viewing their subscribers
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;

CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = auth_id);

CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Creators can view their subscribers"
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.subscriptions s
    JOIN public.creators c ON c.id = s.creator_id
    JOIN public.users cu ON cu.id = c.user_id
    WHERE s.user_id = users.id
      AND cu.auth_id = auth.uid()
  )
);
