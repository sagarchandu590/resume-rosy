## HR Admin Dashboard — Implementation Plan

### 1. Enable Lovable Cloud
Provisions Postgres, auth, storage. Required before any DB/auth work.

### 2. Database schema (migration)
- `candidates` table with all fields (personal, experience, skills, preferences, salary, notice period, resume_url, status, submitted_at). `status` enum: `New | Under Review | Shortlisted | Interview Scheduled | Selected | Rejected`. Default `New`.
- `app_role` enum: `admin | user`; `user_roles` table + `has_role()` SECURITY DEFINER function.
- Storage bucket `resumes` (private) with RLS: candidates can upload; admins can read/download.
- RLS:
  - `candidates`: anyone (anon) can INSERT (public application form); only admins can SELECT/UPDATE/DELETE.
  - `user_roles`: only admins manage; users can read own.
- Trigger to auto-assign `admin` role to the first signed-up user (bootstrap), then normal signups get `user`.

### 3. Extend Candidate Registration Form (`src/routes/index.tsx`)
Add fields to match dashboard spec:
- Primary Skills, Secondary Skills (comma-separated inputs)
- Current Location
- Current Salary, Expected Salary, Notice Period
- Resume upload (PDF/DOC to `resumes` bucket)
- Split experience into Overall / Relevant / Current Company / Previous Company

Submit writes to Supabase `candidates` table (still redirects to /thank-you).

### 4. Auth
- `/auth` public route: email/password sign-in + sign-up (Lovable Cloud email auth).
- `_authenticated/route.tsx` integration-managed gate (should already exist / auto-generated).
- Admin check via `has_role` — non-admin authenticated users see "Not authorized".

### 5. Dashboard (`/_authenticated/dashboard`)
- **Header**: purple→pink gradient matching form.
- **Summary cards** (6): Total, New Today, Freshers, Experienced, Shortlisted, Rejected — icons via lucide, hover lift.
- **Charts** (recharts): Applications by Month (bar), Candidates by Experience (bar), by Qualification (pie), by Status (donut).
- **Search bar**: name / mobile / email (client-side filter after fetch).
- **Filters**: qualification, experience bucket, passed-out year, skills, location, status (Select dropdowns).
- **Table**: latest-first, sortable (date/name/exp), pagination (10/page), status badge, actions (View, Update Status, Delete w/ confirm).
- **Detail modal**: all candidate fields grouped (Personal, Experience, Skills, Job Preferences, Resume download).
- **Status update**: inline Select in row → updates DB + refetches via TanStack Query invalidation.
- **Export**: CSV (papaparse), Excel (xlsx), PDF (jspdf + autotable) — client-side from filtered rows.
- **Empty state + loading skeletons**.

### 6. Header nav on form page
Add "Admin Login" link so admins can reach `/auth`.

### Technical notes
- Data reads use TanStack Query (`useSuspenseQuery`) with a `getCandidates` server fn using `requireSupabaseAuth` + admin role check.
- New candidate INSERT goes through the browser Supabase client with an `anon` INSERT policy (public form).
- Realtime: subscribe to `candidates` INSERTs on the dashboard to refresh live (nice-to-have notification toast).
- All colors use design tokens; gradient utilities kept consistent (`from-indigo-600 via-violet-600 to-fuchsia-600`).

### Out of scope / assumptions
- Resume upload: PDF/DOC ≤10MB, stored in `resumes/<candidate_id>.pdf`; admin download via signed URL.
- Edit candidate: only status editing in v1 (per spec's core actions); full-field edit can come later if you want.
- First signup becomes admin automatically — you can promote others later via SQL.
