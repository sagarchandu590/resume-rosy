import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { ensureDefaultAdmin } from "@/lib/seed-admin.functions";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Login — HR Portal" },
      { name: "description", content: "Sign in to the HR admin dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const seed = useServerFn(ensureDefaultAdmin);
  const [email, setEmail] = useState("g.sagar9550@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(true);

  useEffect(() => {
    // Seed the default admin (safe to run repeatedly) and redirect if already signed in
    (async () => {
      try {
        await seed();
      } catch (e) {
        console.error("Admin seed failed", e);
      } finally {
        setSeeding(false);
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate({ to: "/admin/dashboard" });
    })();
  }, [navigate, seed]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Signed in");
      navigate({ to: "/admin/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50 flex items-center justify-center px-4">
      <Toaster />
      <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-primary-foreground">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ShieldCheck className="h-6 w-6" /> HR Admin Portal
          </CardTitle>
          <CardDescription className="text-primary-foreground/90">
            Sign in to access the candidate dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-white/90 backdrop-blur p-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button
              type="submit"
              disabled={loading || seeding}
              className="w-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700"
            >
              {loading || seeding ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{seeding ? "Preparing..." : "Signing in..."}</>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link to="/" className="text-indigo-600 hover:underline">← Back to application form</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
