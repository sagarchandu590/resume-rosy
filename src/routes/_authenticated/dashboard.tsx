import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  Users, UserPlus, GraduationCap, Briefcase, CheckCircle2, XCircle,
  Search, Download, Eye, Trash2, LogOut, FileText, RefreshCw, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";
import type { Tables } from "@/integrations/supabase/types";
import { exportCSV, exportExcel, exportPDF } from "@/lib/candidateExport";

type Candidate = Tables<"candidates">;
const STATUSES = ["New", "Under Review", "Shortlisted", "Interview Scheduled", "Selected", "Rejected"] as const;
type Status = typeof STATUSES[number];

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "HR Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function useCandidates() {
  return useQuery({
    queryKey: ["candidates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("candidates").select("*").order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as Candidate[];
    },
  });
}

function Dashboard() {
  const { isAdmin } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: candidates = [], isLoading, refetch } = useCandidates();

  const [search, setSearch] = useState("");
  const [fQual, setFQual] = useState("all");
  const [fExp, setFExp] = useState("all");
  const [fYear, setFYear] = useState("all");
  const [fSkill, setFSkill] = useState("");
  const [fLoc, setFLoc] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "exp">("date");
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("candidates-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "candidates" }, (payload) => {
        qc.invalidateQueries({ queryKey: ["candidates"] });
        if (payload.eventType === "INSERT") {
          const c = payload.new as Candidate;
          toast.success(`New candidate: ${c.full_name}`);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const uniq = (key: keyof Candidate) =>
    Array.from(new Set(candidates.map((c) => (c[key] as string) || "").filter(Boolean))).sort();

  const filtered = useMemo(() => {
    let list = candidates.filter((c) => {
      if (search) {
        const s = search.toLowerCase();
        if (!(c.full_name?.toLowerCase().includes(s) || c.mobile?.includes(s) || c.email?.toLowerCase().includes(s))) return false;
      }
      if (fQual !== "all" && c.qualification !== fQual) return false;
      if (fYear !== "all" && c.passed_out_year !== fYear) return false;
      if (fLoc !== "all" && c.current_location !== fLoc) return false;
      if (fStatus !== "all" && c.status !== fStatus) return false;
      if (fSkill && !(c.primary_skills?.toLowerCase().includes(fSkill.toLowerCase()) || c.secondary_skills?.toLowerCase().includes(fSkill.toLowerCase()))) return false;
      if (fExp !== "all") {
        const exp = parseFloat(c.overall_experience || "0");
        if (fExp === "fresher" && exp > 0) return false;
        if (fExp === "1-3" && (exp < 1 || exp > 3)) return false;
        if (fExp === "3-5" && (exp < 3 || exp > 5)) return false;
        if (fExp === "5+" && exp < 5) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "name") return (a.full_name || "").localeCompare(b.full_name || "");
      if (sortBy === "exp") return parseFloat(b.overall_experience || "0") - parseFloat(a.overall_experience || "0");
      return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
    });
    return list;
  }, [candidates, search, fQual, fExp, fYear, fLoc, fStatus, fSkill, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  useEffect(() => { setPage(1); }, [search, fQual, fExp, fYear, fLoc, fStatus, fSkill]);

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const isFresher = (c: Candidate) => (parseFloat(c.overall_experience || "0") || 0) === 0;
    return {
      total: candidates.length,
      today: candidates.filter((c) => new Date(c.submitted_at) >= today).length,
      freshers: candidates.filter(isFresher).length,
      experienced: candidates.filter((c) => !isFresher(c)).length,
      shortlisted: candidates.filter((c) => c.status === "Shortlisted").length,
      rejected: candidates.filter((c) => c.status === "Rejected").length,
    };
  }, [candidates]);

  const charts = useMemo(() => {
    const byMonth = new Map<string, number>();
    candidates.forEach((c) => {
      const d = new Date(c.submitted_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(key, (byMonth.get(key) || 0) + 1);
    });
    const monthData = Array.from(byMonth.entries()).sort().map(([month, count]) => ({ month, count }));

    const expBuckets = { Fresher: 0, "1-3 yrs": 0, "3-5 yrs": 0, "5+ yrs": 0 };
    candidates.forEach((c) => {
      const e = parseFloat(c.overall_experience || "0") || 0;
      if (e === 0) expBuckets.Fresher++;
      else if (e <= 3) expBuckets["1-3 yrs"]++;
      else if (e <= 5) expBuckets["3-5 yrs"]++;
      else expBuckets["5+ yrs"]++;
    });
    const expData = Object.entries(expBuckets).map(([name, count]) => ({ name, count }));

    const qualMap = new Map<string, number>();
    candidates.forEach((c) => { const q = c.qualification || "Unknown"; qualMap.set(q, (qualMap.get(q) || 0) + 1); });
    const qualData = Array.from(qualMap.entries()).map(([name, value]) => ({ name, value }));

    const statusMap = new Map<string, number>();
    STATUSES.forEach((s) => statusMap.set(s, 0));
    candidates.forEach((c) => { statusMap.set(c.status, (statusMap.get(c.status) || 0) + 1); });
    const statusData = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));

    return { monthData, expData, qualData, statusData };
  }, [candidates]);

  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("candidates").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    qc.invalidateQueries({ queryKey: ["candidates"] });
  };

  const doDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("candidates").delete().eq("id", deleteId);
    setDeleteId(null);
    if (error) return toast.error(error.message);
    toast.success("Candidate deleted");
    qc.invalidateQueries({ queryKey: ["candidates"] });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/auth" });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50">
        <Card className="max-w-md shadow-2xl border-0">
          <CardHeader><CardTitle>Not authorized</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Your account is signed in but does not have administrator access.</p>
            <Button onClick={signOut}>Sign out</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50">
      <Toaster />
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-primary-foreground shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">HR Admin Dashboard</h1>
            <p className="text-primary-foreground/90 text-sm">Manage candidate applications</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
            <Button variant="secondary" size="sm" onClick={signOut}><LogOut className="h-4 w-4 mr-1" />Sign out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={<Users />} label="Total Candidates" value={stats.total} gradient="from-indigo-500 to-indigo-700" />
          <StatCard icon={<UserPlus />} label="New Today" value={stats.today} gradient="from-sky-500 to-sky-700" />
          <StatCard icon={<GraduationCap />} label="Freshers" value={stats.freshers} gradient="from-emerald-500 to-emerald-700" />
          <StatCard icon={<Briefcase />} label="Experienced" value={stats.experienced} gradient="from-violet-500 to-violet-700" />
          <StatCard icon={<CheckCircle2 />} label="Shortlisted" value={stats.shortlisted} gradient="from-fuchsia-500 to-fuchsia-700" />
          <StatCard icon={<XCircle />} label="Rejected" value={stats.rejected} gradient="from-rose-500 to-rose-700" />
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Applications by Month">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.monthData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip /><Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Candidates by Experience">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.expData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip /><Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Candidates by Qualification">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={charts.qualData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {charts.qualData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Candidates by Status">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={charts.statusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} label>
                  {charts.statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Filters + Table */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
              <CardTitle>Candidates ({filtered.length})</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => exportCSV(filtered)}><Download className="h-4 w-4 mr-1" />CSV</Button>
                <Button size="sm" variant="outline" onClick={() => exportExcel(filtered)}><Download className="h-4 w-4 mr-1" />Excel</Button>
                <Button size="sm" variant="outline" onClick={() => exportPDF(filtered)}><Download className="h-4 w-4 mr-1" />PDF</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search by name, mobile or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <FilterSelect value={fStatus} onChange={setFStatus} placeholder="Status" options={["all", ...STATUSES]} />
              <FilterSelect value={fExp} onChange={setFExp} placeholder="Experience" options={["all", "fresher", "1-3", "3-5", "5+"]} labels={{ all: "All experience", fresher: "Fresher", "1-3": "1-3 years", "3-5": "3-5 years", "5+": "5+ years" }} />
              <FilterSelect value={fQual} onChange={setFQual} placeholder="Qualification" options={["all", ...uniq("qualification")]} />
              <FilterSelect value={fYear} onChange={setFYear} placeholder="Passed Out Year" options={["all", ...uniq("passed_out_year")]} />
              <FilterSelect value={fLoc} onChange={setFLoc} placeholder="Location" options={["all", ...uniq("current_location")]} />
              <Input placeholder="Filter by skill..." value={fSkill} onChange={(e) => setFSkill(e.target.value)} />
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as "date" | "name" | "exp")}>
                <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort: Latest first</SelectItem>
                  <SelectItem value="name">Sort: Name</SelectItem>
                  <SelectItem value="exp">Sort: Experience</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Name</TableHead><TableHead>Mobile</TableHead><TableHead>Email</TableHead>
                    <TableHead>Qualification</TableHead><TableHead>Year</TableHead><TableHead>Exp</TableHead>
                    <TableHead>Current Company</TableHead><TableHead>Location</TableHead>
                    <TableHead>Skills</TableHead><TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow><TableCell colSpan={12} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                  )}
                  {!isLoading && paged.length === 0 && (
                    <TableRow><TableCell colSpan={12} className="text-center py-14 text-muted-foreground">
                      <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
                      No candidates found. When applicants submit the form, they'll appear here.
                    </TableCell></TableRow>
                  )}
                  {paged.map((c) => (
                    <TableRow key={c.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium">{c.full_name}</TableCell>
                      <TableCell>{c.mobile}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{c.email}</TableCell>
                      <TableCell>{c.qualification || "—"}</TableCell>
                      <TableCell>{c.passed_out_year || "—"}</TableCell>
                      <TableCell>{c.overall_experience || "—"}</TableCell>
                      <TableCell className="max-w-[140px] truncate">{c.current_company || "—"}</TableCell>
                      <TableCell>{c.current_location || "—"}</TableCell>
                      <TableCell className="max-w-[160px] truncate text-xs">{c.primary_skills || "—"}</TableCell>
                      <TableCell>
                        <Select value={c.status} onValueChange={(v) => updateStatus(c.id, v as Status)}>
                          <SelectTrigger className="h-8 w-[150px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{new Date(c.submitted_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" onClick={() => setSelected(c)}><Eye className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {pageCount > 1 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Page {page} of {pageCount}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                  <Button size="sm" variant="outline" disabled={page === pageCount} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <CandidateDialog candidate={selected} onClose={() => setSelected(null)} />
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this candidate?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#d946ef", "#ec4899", "#f59e0b", "#10b981", "#0ea5e9", "#ef4444"];

function StatCard({ icon, label, value, gradient }: { icon: React.ReactNode; label: string; value: number; gradient: string }) {
  return (
    <Card className={`bg-gradient-to-br ${gradient} text-white border-0 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/80">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className="text-white/70 [&_svg]:h-8 [&_svg]:w-8">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function FilterSelect({ value, onChange, placeholder, options, labels }: {
  value: string; onChange: (v: string) => void; placeholder: string; options: string[]; labels?: Record<string, string>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>{o === "all" ? `All ${placeholder.toLowerCase()}` : labels?.[o] ?? o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CandidateDialog({ candidate, onClose }: { candidate: Candidate | null; onClose: () => void }) {
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  useEffect(() => {
    setResumeUrl(null);
    if (candidate?.resume_url) {
      supabase.storage.from("resumes").createSignedUrl(candidate.resume_url, 60 * 10).then(({ data }) => {
        if (data?.signedUrl) setResumeUrl(data.signedUrl);
      });
    }
  }, [candidate]);

  if (!candidate) return null;
  const G = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2">{title}</h3>
      <div className="grid gap-2 sm:grid-cols-2 text-sm">{children}</div>
    </div>
  );
  const F = ({ label, value }: { label: string; value?: string | null }) => (
    <div><span className="text-muted-foreground">{label}: </span><span className="font-medium">{value || "—"}</span></div>
  );

  return (
    <Dialog open={!!candidate} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{candidate.full_name}</DialogTitle>
          <DialogDescription>
            <Badge variant="outline" className="mr-2">{candidate.status}</Badge>
            Submitted {new Date(candidate.submitted_at).toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <G title="Personal Information">
            <F label="Full Name" value={candidate.full_name} />
            <F label="Mobile" value={candidate.mobile} />
            <F label="Email" value={candidate.email} />
            <F label="Qualification" value={candidate.qualification} />
            <F label="Passed Out Year" value={candidate.passed_out_year} />
          </G>
          <G title="Experience">
            <F label="Overall Experience" value={candidate.overall_experience} />
            <F label="Relevant Experience" value={candidate.relevant_experience} />
            <F label="Current Company" value={candidate.current_company} />
            <F label="Previous Company" value={candidate.previous_company} />
          </G>
          <G title="Skills">
            <F label="Primary Skills" value={candidate.primary_skills} />
            <F label="Secondary Skills" value={candidate.secondary_skills} />
          </G>
          <G title="Job Preferences">
            <F label="Current Location" value={candidate.current_location} />
            <F label="Preferred Location" value={candidate.preferred_location} />
            <F label="Current Salary" value={candidate.current_salary} />
            <F label="Expected Salary" value={candidate.expected_salary} />
            <F label="Notice Period" value={candidate.notice_period} />
            <F label="Work Mode" value={candidate.work_mode} />
          </G>
          <G title="Resume">
            {resumeUrl ? (
              <a href={resumeUrl} target="_blank" rel="noreferrer">
                <Button size="sm"><FileText className="h-4 w-4 mr-1" /> Download Resume</Button>
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">{candidate.resume_url ? "Preparing download..." : "No resume uploaded."}</p>
            )}
          </G>
        </div>
      </DialogContent>
    </Dialog>
  );
}
