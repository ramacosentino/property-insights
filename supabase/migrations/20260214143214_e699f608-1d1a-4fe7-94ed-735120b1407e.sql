
CREATE TABLE public.upload_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE,
  source TEXT NOT NULL DEFAULT 'manual', -- 'manual' or 'api'
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'success', 'partial', 'error'
  total_rows INTEGER DEFAULT 0,
  processed INTEGER DEFAULT 0,
  skipped INTEGER DEFAULT 0,
  errors TEXT[],
  error_message TEXT,
  filename TEXT
);

ALTER TABLE public.upload_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read upload logs"
ON public.upload_logs
FOR SELECT
USING (true);

CREATE POLICY "Service role can insert upload logs"
ON public.upload_logs
FOR INSERT
WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "Service role can update upload logs"
ON public.upload_logs
FOR UPDATE
USING (auth.role() = 'service_role'::text);
