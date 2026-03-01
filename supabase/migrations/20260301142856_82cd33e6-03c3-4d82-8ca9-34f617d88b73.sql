CREATE POLICY "Admins can read CSVs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'upload-csvs' AND 
  public.has_role(auth.uid(), 'admin'::public.app_role)
);