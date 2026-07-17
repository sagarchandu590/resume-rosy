import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { ArrowLeft, LogOut, Loader2, Mail, Phone, MapPin, Briefcase, GraduationCap, FileText, DollarSign, Clock } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Candidate = Tables<"candidates">;
const STATUSES = ["New", "Under Review", "Shortlisted", "Interview Scheduled", "Selected", "Rejected"] as const;
type Status = typeof STATUSES[number];

export const Route = createFileRoute("/_authenticated/admin/candidates/$id")({
  head: () => ({ meta: [{ title: "Candidate Details — HR Portal" }, { name: "robots", content: "noindex" }] }),
  component: CandidateDetail,
});

function CandidateDetail() {
  const { id } = Route.useParams();
  const { isAdmin } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: candidate, isLoading } = useQuery({
    queryKey: ["candidate", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("candidates").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Candidate | null;
    },
  });

  const updateStatus = async (status: Status) => {
    const { error } = await supabase.from("candidates").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    qc.invalidateQueries({ queryKey: ["candidate", id] });
    qc.invalidateQueries({ queryKey: ["candidates"] });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/auth" });
  };

  const downloadResume = async () => {
    if (!candidate?.resume_url) return;
    const { data, error } = await supabase.storage.from("resumes").createSignedUrl(candidate.resume_url, 60);
    if (error || !data) return toast.error("Could not generate download link");
    window.open(data.signedUrl, "_blank");
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50">
        <Card className="max-w-md shadow-2xl border-0">
          <CardHeader><CardTitle>Not authorized</CardTitle></CardHeader>
          <CardContent><Button onClick={signOut}>Sign out</Button></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50">
      <Toaster />
      <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-primary-foreground shadow-lg">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" asChild>
              <Link to="/admin/candidates"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold">Candidate Details</h1>
          </div>
          <Button variant="secondary" size="sm" onClick={signOut}><LogOut className="h-4 w-4 mr-1" />Sign out</Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        {isLoading && <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
        {!isLoading && !candidate && (
          <Card className="shadow-lg border-0">
            <CardContent className="py-14 text-center text-muted-foreground">Candidate not found.</CardContent>
          </Card>
        )}
        {candidate && (
          <div className="space-y-6">
            {/* Header card */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 h-24" />
              <CardContent className="pt-6 -mt-12">
                <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
                  <div>
                    <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center text-3xl font-bold text-indigo-600 mb-3">
                      {candidate.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="text-2xl font-bold">{candidate.full_name}</h2>
                    <p className="text-muted-foreground flex items-center gap-3 flex-wrap mt-1 text-sm">
                      <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{candidate.email}</span>
                      <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{candidate.mobile}</span>
                      {candidate.current_location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{candidate.current_location}</span>}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <Badge variant="outline" className="text-sm">{candidate.status}</Badge>
                    <Select value={candidate.status} onValueChange={(v) => updateStatus(v as Status)}>
                      <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Section icon={<GraduationCap className="h-5 w-5" />} title="Education">
                <Row label="Qualification" value={candidate.qualification} />
                <Row label="Passed Out Year" value={candidate.passed_out_year} />
              </Section>

              <Section icon={<Briefcase className="h-5 w-5" />} title="Experience">
                <Row label="Overall" value={candidate.overall_experience} />
                <Row label="Relevant" value={candidate.relevant_experience} />
                <Row label="Current Company" value={candidate.current_company} />
                <Row label="Previous Company" value={candidate.previous_company} />
                <Row label="Previous Domain" value={candidate.previous_domain} />
              </Section>

              <Section icon={<FileText className="h-5 w-5" />} title="Skills & Domain">
                <Row label="Primary Skills" value={candidate.primary_skills} />
                <Row label="Secondary Skills" value={candidate.secondary_skills} />
                <Row label="IT / Non-IT" value={candidate.it_or_non_it} />
                <Row label="Required Domain" value={candidate.required_domain} />
              </Section>

              <Section icon={<MapPin className="h-5 w-5" />} title="Job Preferences">
                <Row label="Preferred Location" value={candidate.preferred_location} />
                <Row label="Work Mode" value={candidate.work_mode} />
              </Section>

              <Section icon={<DollarSign className="h-5 w-5" />} title="Compensation">
                <Row label="Current Salary" value={candidate.current_salary} />
                <Row label="Expected Salary" value={candidate.expected_salary} />
                <Row label="Previous Package" value={candidate.previous_package} />
              </Section>

              <Section icon={<Clock className="h-5 w-5" />} title="Availability">
                <Row label="Notice Period" value={candidate.notice_period} />
                <Row label="Submitted" value={new Date(candidate.submitted_at).toLocaleString()} />
              </Section>
            </div>

            {candidate.resume_url && (
              <Card className="shadow-lg border-0">
                <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Resume</CardTitle></CardHeader>
                <CardContent>
                  <Button onClick={downloadResume} className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700">
                    Download Resume
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base">{icon}{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">{children}</CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 py-1 border-b border-dashed last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}
