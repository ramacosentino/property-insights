ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tour_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS discovery_checklist jsonb NOT NULL DEFAULT '{}'::jsonb;