import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Search, Eye, LogOut, Loader2, Users, ArrowLeft, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Candidate = Tables<"candidates">;
const STATUSES = ["New", "Under Review", "Shortlisted", "Interview Scheduled", "Selected", "Rejected"] as const;
type Status = typeof STATUSES[number];

export const Route = createFileRoute("/_authenticated/admin/candidates/")({
  head: () => ({ meta: [{ title: "Candidates — HR Portal" }, { name: "robots", content: "noindex" }] }),
  component: CandidatesList,
});

function CandidatesList() {
  const { isAdmin } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState<string>("all");

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["candidates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("candidates").select("*").order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as Candidate[];
    },
  });

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (fStatus !== "all" && c.status !== fStatus) return false;
      if (search) {
        const s = search.toLowerCase();
        return c.full_name?.toLowerCase().includes(s) || c.mobile?.includes(s) || c.email?.toLowerCase().includes(s);
      }
      return true;
    });
  }, [candidates, search, fStatus]);

  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("candidates").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    qc.invalidateQueries({ queryKey: ["candidates"] });
  };

  const deleteCandidate = async (id: string) => {
    if (!confirm("Delete this candidate?")) return;
    const { error } = await supabase.from("candidates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
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
            <p className="text-sm text-muted-foreground mb-4">Your account does not have administrator access.</p>
            <Button onClick={signOut}>Sign out</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50">
      <Toaster />
      <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-primary-foreground shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Candidates</h1>
            <p className="text-primary-foreground/90 text-sm">All submitted applications</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" asChild>
              <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" />Dashboard</Link>
            </Button>
            <Button variant="secondary" size="sm" onClick={signOut}><LogOut className="h-4 w-4 mr-1" />Sign out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>All Candidates ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search by name, mobile or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={fStatus} onValueChange={setFStatus}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                  )}
                  {!isLoading && filtered.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-14 text-muted-foreground">
                      <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
                      No candidates found.
                    </TableCell></TableRow>
                  )}
                  {filtered.map((c) => (
                    <TableRow key={c.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium">{c.full_name}</TableCell>
                      <TableCell>{c.mobile}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{c.email}</TableCell>
                      <TableCell>{c.overall_experience || "—"}</TableCell>
                      <TableCell>{c.current_location || "—"}</TableCell>
                      <TableCell>
                        <Select value={c.status} onValueChange={(v) => updateStatus(c.id, v as Status)}>
                          <SelectTrigger className="h-8 w-[160px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" asChild>
                            <Link to="/admin/candidates/$id" params={{ id: c.id }}><Eye className="h-4 w-4" /></Link>
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteCandidate(c.id)}>
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
