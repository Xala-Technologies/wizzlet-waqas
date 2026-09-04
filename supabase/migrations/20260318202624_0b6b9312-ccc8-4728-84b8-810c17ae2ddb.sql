
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 9.99,
  billing_period text NOT NULL DEFAULT 'monthly',
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active products are viewable by everyone"
  ON public.products FOR SELECT TO public
  USING (is_active = true);

CREATE POLICY "Creators can view own products"
  ON public.products FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM creators c JOIN users u ON u.id = c.user_id
    WHERE c.id = products.creator_id AND u.auth_id = auth.uid()
  ));

CREATE POLICY "Creators can insert products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM creators c JOIN users u ON u.id = c.user_id
    WHERE c.id = products.creator_id AND u.auth_id = auth.uid()
  ));

CREATE POLICY "Creators can update own products"
  ON public.products FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM creators c JOIN users u ON u.id = c.user_id
    WHERE c.id = products.creator_id AND u.auth_id = auth.uid()
  ));

CREATE POLICY "Creators can delete own products"
  ON public.products FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM creators c JOIN users u ON u.id = c.user_id
    WHERE c.id = products.creator_id AND u.auth_id = auth.uid()
  ));
