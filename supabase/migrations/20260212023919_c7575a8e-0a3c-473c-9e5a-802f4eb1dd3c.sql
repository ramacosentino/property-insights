
-- Drop the overly permissive policy and replace with service-role-only insert
DROP POLICY "Service role can manage geocoded addresses" ON public.geocoded_addresses;

-- Only authenticated service role can insert (edge functions use service role key)
CREATE POLICY "Service role insert geocoded addresses"
  ON public.geocoded_addresses FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role update geocoded addresses"
  ON public.geocoded_addresses FOR UPDATE
  USING (auth.role() = 'service_role');
