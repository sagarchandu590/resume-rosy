import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Candidate Registration — HR Portal" },
      { name: "description", content: "Submit your candidate application." },
    ],
  }),
  component: Index,
});

type FormState = {
  full_name: string;
  qualification: string;
  passed_out_year: string;
  mobile: string;
  email: string;
  overall_experience: string;
  relevant_experience: string;
  current_company: string;
  previous_company: string;
  previous_domain: string;
  primary_skills: string;
  secondary_skills: string;
  it_or_non_it: string;
  required_domain: string;
  current_location: string;
  preferred_location: string;
  work_mode: string;
  current_salary: string;
  expected_salary: string;
  notice_period: string;
};

const initial: FormState = {
  full_name: "", qualification: "", passed_out_year: "", mobile: "", email: "",
  overall_experience: "", relevant_experience: "", current_company: "", previous_company: "",
  previous_domain: "", primary_skills: "", secondary_skills: "", it_or_non_it: "",
  required_domain: "", current_location: "", preferred_location: "", work_mode: "",
  current_salary: "", expected_salary: "", notice_period: "",
};

function Index() {
  const [form, setForm] = useState<FormState>(initial);
  const [resume, setResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mobileError, setMobileError] = useState("");
  const navigate = useNavigate();

  const upd = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const updMobile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setForm((f) => ({ ...f, mobile: digits }));
    setMobileError(digits.length === 0 || digits.length === 10 ? "" : "Please enter a valid 10-digit mobile number.");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.mobile || !form.email) return toast.error("Fill name, mobile and email.");
    if (!/^\d{10}$/.test(form.mobile)) { setMobileError("Please enter a valid 10-digit mobile number."); return toast.error("Invalid mobile"); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return toast.error("Enter a valid email.");

    setSubmitting(true);
    try {
      let resume_url: string | null = null;
      if (resume) {
        const ext = resume.name.split(".").pop() || "pdf";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("resumes").upload(path, resume, {
          contentType: resume.type || "application/octet-stream",
        });
        if (upErr) throw upErr;
        resume_url = path;
      }
      const { error } = await supabase.from("candidates").insert({ ...form, resume_url });
      if (error) throw error;
      setForm(initial); setResume(null);
      navigate({ to: "/thank-you" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50 py-10 px-4">
      <Toaster />
      <div className="mx-auto max-w-4xl">
        <Card className="shadow-2xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-primary-foreground">
            <CardTitle className="text-3xl font-bold">Candidate Details</CardTitle>
            <CardDescription className="text-primary-foreground/90">Fill in your personal, experience and preference details.</CardDescription>
          </CardHeader>
          <CardContent className="bg-white/80 backdrop-blur p-6 sm:p-8">
            <form onSubmit={onSubmit} className="space-y-6">
              <Section title="Personal Information" color="indigo">
                <Field label="Full Name" required><Input value={form.full_name} onChange={upd("full_name")} placeholder="John Doe" /></Field>
                <Field label="Qualification"><Input value={form.qualification} onChange={upd("qualification")} placeholder="B.Tech / MBA" /></Field>
                <Field label="Passed Out Year"><Input type="number" value={form.passed_out_year} onChange={upd("passed_out_year")} placeholder="2022" /></Field>
                <Field label="Mobile Number" required error={mobileError}>
                  <Input type="tel" inputMode="numeric" maxLength={10} value={form.mobile} onChange={updMobile}
                    onKeyDown={(e) => { if (["e","E","+","-",".",",", " "].includes(e.key)) e.preventDefault(); }}
                    placeholder="10-digit number" aria-invalid={!!mobileError} />
                </Field>
                <Field label="Email ID" required><Input type="email" value={form.email} onChange={upd("email")} placeholder="you@example.com" /></Field>
                <Field label="Current Location"><Input value={form.current_location} onChange={upd("current_location")} placeholder="Hyderabad" /></Field>
              </Section>

              <Section title="Experience" color="emerald">
                <Field label="Overall Experience (years)"><Input value={form.overall_experience} onChange={upd("overall_experience")} placeholder="e.g. 5" /></Field>
                <Field label="Relevant Experience (years)"><Input value={form.relevant_experience} onChange={upd("relevant_experience")} placeholder="e.g. 3" /></Field>
                <Field label="Current Company"><Input value={form.current_company} onChange={upd("current_company")} placeholder="Company name" /></Field>
                <Field label="Previous Company"><Input value={form.previous_company} onChange={upd("previous_company")} placeholder="Previous employer" /></Field>
                <Field label="Previous Domain"><Input value={form.previous_domain} onChange={upd("previous_domain")} placeholder="e.g. Java Backend" /></Field>
              </Section>

              <Section title="Skills" color="sky">
                <Field label="Primary Skills"><Textarea value={form.primary_skills} onChange={upd("primary_skills")} placeholder="React, TypeScript, Node.js" rows={2} /></Field>
                <Field label="Secondary Skills"><Textarea value={form.secondary_skills} onChange={upd("secondary_skills")} placeholder="Docker, AWS, GraphQL" rows={2} /></Field>
              </Section>

              <Section title="Job Preferences" color="fuchsia">
                <Field label="IT or Non-IT">
                  <Select value={form.it_or_non_it} onValueChange={(v) => setForm((f) => ({ ...f, it_or_non_it: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="Non-IT">Non-IT</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Required Domain"><Input value={form.required_domain} onChange={upd("required_domain")} placeholder="e.g. Data Engineering" /></Field>
                <Field label="Preferred Location"><Input value={form.preferred_location} onChange={upd("preferred_location")} placeholder="e.g. Bangalore" /></Field>
                <Field label="Current Salary (LPA)"><Input value={form.current_salary} onChange={upd("current_salary")} placeholder="e.g. 8.5" /></Field>
                <Field label="Expected Salary (LPA)"><Input value={form.expected_salary} onChange={upd("expected_salary")} placeholder="e.g. 14" /></Field>
                <Field label="Notice Period"><Input value={form.notice_period} onChange={upd("notice_period")} placeholder="e.g. 30 days" /></Field>
                <Field label="Work Mode">
                  <RadioGroup value={form.work_mode} onValueChange={(v) => setForm((f) => ({ ...f, work_mode: v }))} className="flex gap-6 pt-2 flex-wrap">
                    <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="WFH" /> Work from Home</label>
                    <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="Office" /> Office</label>
                    <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="Hybrid" /> Hybrid</label>
                  </RadioGroup>
                </Field>
              </Section>

              <Section title="Resume" color="violet">
                <Field label="Upload Resume (PDF / DOC, max 10MB)">
                  <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResume(e.target.files?.[0] ?? null)} />
                </Field>
              </Section>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setForm(initial); setResume(null); }} disabled={submitting}>Reset</Button>
                <Button type="submit" disabled={submitting || !/^\d{10}$/.test(form.mobile)}
                  className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700">
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : "Submit Details"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const colorMap = {
  indigo: "border-indigo-100 from-indigo-50/80 text-indigo-700 bg-indigo-600",
  emerald: "border-emerald-100 from-emerald-50/80 text-emerald-700 bg-emerald-600",
  sky: "border-sky-100 from-sky-50/80 text-sky-700 bg-sky-600",
  fuchsia: "border-fuchsia-100 from-fuchsia-50/80 text-fuchsia-700 bg-fuchsia-600",
  violet: "border-violet-100 from-violet-50/80 text-violet-700 bg-violet-600",
} as const;

function Section({ title, color, children }: { title: string; color: keyof typeof colorMap; children: React.ReactNode }) {
  const [border, from, text, dot] = colorMap[color].split(" ");
  return (
    <section className={`space-y-4 rounded-xl border ${border} bg-gradient-to-br ${from} to-white p-5 shadow-sm`}>
      <h2 className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${text}`}>
        <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />{title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label} {required && <span className="text-destructive">*</span>}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
