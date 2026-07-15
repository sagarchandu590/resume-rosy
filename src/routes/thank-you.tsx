import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/thank-you")({
  head: () => ({
    meta: [
      { title: "Thank You — Candidate Application" },
      { name: "description", content: "Your application has been submitted successfully." },
      { property: "og:title", content: "Thank You — Candidate Application" },
      { property: "og:description", content: "Your application has been submitted successfully." },
    ],
  }),
  component: ThankYouPage,
});

function ThankYouPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50 px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-xl">
        <Card className="border-0 shadow-2xl overflow-hidden bg-white/90 backdrop-blur">
          <CardContent className="flex flex-col items-center p-8 text-center sm:p-12">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 sm:h-28 sm:w-28">
              <CheckCircle2 className="h-14 w-14 text-emerald-600 sm:h-16 sm:w-16" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Thank You!
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Your application has been submitted successfully.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Thank you for your interest. Our recruitment team will review your application and
              contact you if your profile matches our requirements.
            </p>
            <Button
              asChild
              className="mt-8 bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-8 py-5 text-base font-medium hover:from-indigo-700 hover:to-fuchsia-700"
            >
              <Link to="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
