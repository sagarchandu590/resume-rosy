
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Bootstrap: first user becomes admin, rest become user
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Candidate status enum
CREATE TYPE public.candidate_status AS ENUM (
  'New', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'
);

CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT NOT NULL,
  qualification TEXT,
  passed_out_year TEXT,
  overall_experience TEXT,
  relevant_experience TEXT,
  genuine_experience TEXT,
  fake_experience TEXT,
  current_company TEXT,
  previous_company TEXT,
  previous_domain TEXT,
  primary_skills TEXT,
  secondary_skills TEXT,
  it_or_non_it TEXT,
  required_domain TEXT,
  current_location TEXT,
  preferred_location TEXT,
  work_mode TEXT,
  current_salary TEXT,
  expected_salary TEXT,
  previous_package TEXT,
  notice_period TEXT,
  resume_url TEXT,
  status candidate_status NOT NULL DEFAULT 'New',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidates TO authenticated;
GRANT INSERT ON public.candidates TO anon;
GRANT ALL ON public.candidates TO service_role;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an application
CREATE POLICY "Anyone can submit application" ON public.candidates FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Only admins can view/edit/delete
CREATE POLICY "Admins view candidates" ON public.candidates FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update candidates" ON public.candidates FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete candidates" ON public.candidates FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER candidates_touch_updated BEFORE UPDATE ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX candidates_submitted_at_idx ON public.candidates (submitted_at DESC);
CREATE INDEX candidates_status_idx ON public.candidates (status);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates;
