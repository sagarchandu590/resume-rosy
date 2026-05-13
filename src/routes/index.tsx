import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

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

  const update = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.mobile || !form.email) {
      toast.error("Please fill name, mobile and email.");
      return;
    }
    if (!/^\d{10}$/.test(form.mobile)) {
      toast.error("Mobile number must be 10 digits.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    console.log("Candidate submission:", form);
    toast.success("Details submitted successfully!");
    setForm(initial);
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <Toaster />
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader className="rounded-t-xl bg-primary text-primary-foreground">
            <CardTitle className="text-2xl">Candidate Details</CardTitle>
            <CardDescription>Fill in your personal, experience and preference details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-8">
              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
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
                  <Field label="Mobile Number" required>
                    <Input type="tel" value={form.mobile} onChange={update("mobile")} placeholder="10-digit number" />
                  </Field>
                  <Field label="Email ID" required>
                    <Input type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" />
                  </Field>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
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

              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
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

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setForm(initial)}>
                  Reset
                </Button>
                <Button type="submit">Submit Details</Button>
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
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
