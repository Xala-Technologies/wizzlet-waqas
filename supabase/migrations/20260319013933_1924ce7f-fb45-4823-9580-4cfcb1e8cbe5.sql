
CREATE TABLE public.pick_tracker (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  pick_event text NOT NULL,
  sport text NOT NULL DEFAULT 'NFL',
  odds text,
  units_risked numeric NOT NULL DEFAULT 1,
  result text NOT NULL DEFAULT 'pending',
  units_won_lost numeric DEFAULT 0,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pick_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own picks"
  ON public.pick_tracker FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own picks"
  ON public.pick_tracker FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own picks"
  ON public.pick_tracker FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own picks"
  ON public.pick_tracker FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
