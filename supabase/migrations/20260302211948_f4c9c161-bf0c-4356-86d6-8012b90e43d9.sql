
-- Usage tracking: monthly counters per user
CREATE TABLE public.usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  year_month text NOT NULL, -- format: '2026-03'
  analyses_count integer NOT NULL DEFAULT 0,
  comparisons_count integer NOT NULL DEFAULT 0,
  searches_count integer NOT NULL DEFAULT 0,
  exports_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, year_month)
);

-- Enable RLS
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own usage"
ON public.usage_tracking
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own usage
CREATE POLICY "Users can insert their own usage"
ON public.usage_tracking
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage
CREATE POLICY "Users can update their own usage"
ON public.usage_tracking
FOR UPDATE
USING (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role full access usage"
ON public.usage_tracking
FOR ALL
USING (auth.role() = 'service_role'::text);

-- Trigger for updated_at
CREATE TRIGGER update_usage_tracking_updated_at
BEFORE UPDATE ON public.usage_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
