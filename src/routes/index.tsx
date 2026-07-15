import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

type FormState = {
  fullName: string;
  qualification: string;
  passedOutYear: string;
  mobile: string;
  email: string;
  overallExperience: string;
  genuineExperience: string;
  fakeExperience: string;
  previousPackage: string;
  previousCompany: string;
  previousDomain: string;
  itOrNonIt: string;
  requiredDomain: string;
  preferredLocation: string;
  workMode: string;
};

const initial: FormState = {
  fullName: "",
  qualification: "",
  passedOutYear: "",
  mobile: "",
  email: "",
  overallExperience: "",
  genuineExperience: "",
  fakeExperience: "",
  previousPackage: "",
  previousCompany: "",
  previousDomain: "",
  itOrNonIt: "",
  requiredDomain: "",
  preferredLocation: "",
  workMode: "",
};

function Index() {
  const [form, setForm] = useState<FormState>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [mobileError, setMobileError] = useState("");
  const navigate = useNavigate();

  const update = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const updateMobile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setForm((f) => ({ ...f, mobile: digits }));
    if (digits.length === 0 || digits.length === 10) {
      setMobileError("");
    } else {
      setMobileError("Please enter a valid 10-digit mobile number.");
    }
  };


  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.mobile || !form.email) {
      toast.error("Please fill name, mobile and email.");
      return;
    }
    if (!/^\d{10}$/.test(form.mobile)) {
      setMobileError("Please enter a valid 10-digit mobile number.");
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      console.log("Candidate submission:", form);
      setForm(initial);
      setMobileError("");
      navigate({ to: "/thank-you" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50 py-10 px-4">
      <Toaster />
      <div className="mx-auto max-w-3xl">
        <Card className="shadow-2xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-primary-foreground">
            <CardTitle className="text-3xl font-bold">Candidate Details</CardTitle>
            <CardDescription className="text-primary-foreground/90">Fill in your personal, experience and preference details.</CardDescription>
          </CardHeader>
          <CardContent className="bg-white/80 backdrop-blur p-6 sm:p-8">
            <form onSubmit={onSubmit} className="space-y-6">
              <section className="space-y-4 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-indigo-700">
                  <span className="inline-block h-2 w-2 rounded-full bg-indigo-600" />
                  Personal Information
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full Name" required>
                    <Input value={form.fullName} onChange={update("fullName")} placeholder="John Doe" />
                  </Field>
                  <Field label="Qualification">
                    <Input value={form.qualification} onChange={update("qualification")} placeholder="B.Tech / MBA / ..." />
                  </Field>
                  <Field label="Passed Out Year">
                    <Input type="number" value={form.passedOutYear} onChange={update("passedOutYear")} placeholder="2022" />
                  </Field>
                  <Field label="Mobile Number" required error={mobileError}>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      value={form.mobile}
                      onChange={updateMobile}
                      onKeyDown={(e) => {
                        if (
                          ["e", "E", "+", "-", ".", ",", " "].includes(e.key)
                        ) {
                          e.preventDefault();
                        }
                      }}
                      placeholder="10-digit number"
                      aria-invalid={!!mobileError}
                    />
                  </Field>
                  <Field label="Email ID" required>
                    <Input type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" />
                  </Field>
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-700">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" />
                  Experience
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Overall Experience (years)">
                    <Input value={form.overallExperience} onChange={update("overallExperience")} placeholder="e.g. 5" />
                  </Field>
                  <Field label="Genuine Experience (years)">
                    <Input value={form.genuineExperience} onChange={update("genuineExperience")} placeholder="e.g. 3" />
                  </Field>
                  <Field label="Fake Experience (years)">
                    <Input value={form.fakeExperience} onChange={update("fakeExperience")} placeholder="e.g. 2" />
                  </Field>
                  <Field label="Previous Package (LPA)">
                    <Input value={form.previousPackage} onChange={update("previousPackage")} placeholder="e.g. 8.5" />
                  </Field>
                  <Field label="Previous Company">
                    <Input value={form.previousCompany} onChange={update("previousCompany")} placeholder="Company name" />
                  </Field>
                  <Field label="Previous Domain">
                    <Input value={form.previousDomain} onChange={update("previousDomain")} placeholder="e.g. Java Backend" />
                  </Field>
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-fuchsia-100 bg-gradient-to-br from-fuchsia-50/80 to-white p-5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-fuchsia-700">
                  <span className="inline-block h-2 w-2 rounded-full bg-fuchsia-600" />
                  Preferences
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="IT or Non-IT">
                    <Select value={form.itOrNonIt} onValueChange={(v) => setForm((f) => ({ ...f, itOrNonIt: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="Non-IT">Non-IT</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Required Domain">
                    <Input value={form.requiredDomain} onChange={update("requiredDomain")} placeholder="e.g. Data Engineering" />
                  </Field>
                  <Field label="Preferred Location">
                    <Input value={form.preferredLocation} onChange={update("preferredLocation")} placeholder="e.g. Hyderabad" />
                  </Field>
                  <Field label="Work Mode">
                    <RadioGroup
                      value={form.workMode}
                      onValueChange={(v) => setForm((f) => ({ ...f, workMode: v }))}
                      className="flex gap-6 pt-2"
                    >
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="WFH" /> Work from Home
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="Office" /> Office
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="Hybrid" /> Hybrid
                      </label>
                    </RadioGroup>
                  </Field>
                </div>
              </section>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setForm(initial)} disabled={submitting}>
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !/^\d{10}$/.test(form.mobile)}
                  className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700"
                >
                  {submitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
                  ) : (
                    "Submit Details"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
