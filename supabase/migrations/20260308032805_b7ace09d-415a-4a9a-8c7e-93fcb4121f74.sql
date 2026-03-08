
-- Add last_evaluated_at to alerts for tracking when each alert was last checked
ALTER TABLE public.alerts ADD COLUMN last_evaluated_at timestamptz DEFAULT now();

-- Add last_known_price and notified_removed to saved_projects for change detection
ALTER TABLE public.saved_projects ADD COLUMN last_known_price numeric DEFAULT NULL;
ALTER TABLE public.saved_projects ADD COLUMN notified_removed boolean NOT NULL DEFAULT false;

-- Allow service_role to insert notifications (already exists) and manage alerts evaluation
CREATE POLICY "Service role can update alerts" ON public.alerts FOR UPDATE USING (auth.role() = 'service_role'::text);
CREATE POLICY "Service role can read alerts" ON public.alerts FOR SELECT USING (auth.role() = 'service_role'::text);
CREATE POLICY "Service role can read saved_projects" ON public.saved_projects FOR SELECT USING (auth.role() = 'service_role'::text);
CREATE POLICY "Service role can update saved_projects" ON public.saved_projects FOR UPDATE USING (auth.role() = 'service_role'::text);
