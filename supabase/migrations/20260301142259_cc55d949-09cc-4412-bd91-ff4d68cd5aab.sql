DROP POLICY "Anyone can read properties" ON public.properties;

CREATE POLICY "Authenticated users can read properties"
  ON public.properties FOR SELECT
  TO authenticated
  USING (true);