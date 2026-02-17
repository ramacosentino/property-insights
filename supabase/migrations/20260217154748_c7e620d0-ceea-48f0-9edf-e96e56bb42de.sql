
-- Table for private per-user property analysis
CREATE TABLE public.user_property_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  score_multiplicador numeric,
  valor_potencial_m2 numeric,
  valor_potencial_total numeric,
  comparables_count integer,
  oportunidad_ajustada numeric,
  oportunidad_neta numeric,
  informe_breve text,
  highlights text[],
  lowlights text[],
  estado_general text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

ALTER TABLE public.user_property_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analyses"
  ON public.user_property_analysis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses"
  ON public.user_property_analysis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses"
  ON public.user_property_analysis FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
  ON public.user_property_analysis FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_property_analysis_updated_at
  BEFORE UPDATE ON public.user_property_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add discarded_at to saved_projects for soft-delete
ALTER TABLE public.saved_projects
  ADD COLUMN discarded_at timestamptz DEFAULT NULL;
