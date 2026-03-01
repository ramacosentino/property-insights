
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 3. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. RLS: only admins can read roles (bootstrapped via security definer)
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Security definer function to check roles without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 6. Assign admin to ramacosentino@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('b6057b2a-4e7d-4bc7-89a8-89d306984b78', 'admin');

-- 7. Drop the public read policy on upload_logs
DROP POLICY IF EXISTS "Anyone can read upload logs" ON public.upload_logs;

-- 8. Create admin-only read policy on upload_logs
CREATE POLICY "Admins can read upload logs"
  ON public.upload_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
