
-- Table to persist search runs with filters and results
CREATE TABLE public.search_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',  -- pending, filtering, analyzing, completed, failed
  filters jsonb NOT NULL DEFAULT '{}',
  -- Search progress
  total_matched integer DEFAULT 0,
  candidates_count integer DEFAULT 0,
  analyzed_count integer DEFAULT 0,
  -- Results: array of property IDs ordered by oportunidad_neta desc
  result_property_ids uuid[] DEFAULT '{}',
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.search_runs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own searches
CREATE POLICY "Users can view their own searches"
  ON public.search_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own searches"
  ON public.search_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own searches"
  ON public.search_runs FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can update (edge function updates progress)
CREATE POLICY "Service role can update search runs"
  ON public.search_runs FOR UPDATE
  USING (auth.role() = 'service_role');

-- Index for user queries
CREATE INDEX idx_search_runs_user_id ON public.search_runs (user_id, created_at DESC);
