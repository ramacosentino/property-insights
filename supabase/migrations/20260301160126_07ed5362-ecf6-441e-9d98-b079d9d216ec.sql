
CREATE TABLE public.ignored_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

ALTER TABLE public.ignored_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ignored opportunities"
  ON public.ignored_opportunities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ignored opportunities"
  ON public.ignored_opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ignored opportunities"
  ON public.ignored_opportunities FOR DELETE
  USING (auth.uid() = user_id);
