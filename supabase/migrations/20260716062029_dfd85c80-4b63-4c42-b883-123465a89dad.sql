
-- Tighten SECURITY DEFINER function permissions
REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
-- authenticated keeps execute so RLS policies can call has_role()

-- Replace overly-permissive candidate insert policy with a basic sanity check
DROP POLICY IF EXISTS "Anyone can submit application" ON public.candidates;
CREATE POLICY "Anyone can submit application" ON public.candidates
FOR INSERT TO anon, authenticated
WITH CHECK (char_length(full_name) > 0 AND char_length(email) > 3 AND char_length(mobile) >= 10);

-- Storage policies for resumes bucket
CREATE POLICY "Anyone can upload a resume" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Admins can read resumes" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'resumes' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete resumes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'resumes' AND public.has_role(auth.uid(), 'admin'));
