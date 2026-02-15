
-- Create storage bucket for uploaded CSVs
INSERT INTO storage.buckets (id, name, public)
VALUES ('upload-csvs', 'upload-csvs', false);

-- Allow service role to insert files
CREATE POLICY "Service role can upload CSVs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'upload-csvs' AND auth.role() = 'service_role'::text);

-- Allow service role to read files
CREATE POLICY "Service role can read CSVs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'upload-csvs' AND auth.role() = 'service_role'::text);

-- Add file_url column to upload_logs
ALTER TABLE public.upload_logs
ADD COLUMN file_url text DEFAULT NULL;
