
CREATE POLICY "Service role can insert analyses"
  ON public.user_property_analysis FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update analyses"
  ON public.user_property_analysis FOR UPDATE
  USING (auth.role() = 'service_role');
