import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // Supabase's built-in resetPasswordForEmail sends a recovery link
      // that redirects back to /reset-password (configured below in the
      // redirectTo option). The redirect URL must be listed in the
      // Supabase dashboard's "Redirect URLs" allowlist for the email.
      //
      // We prefer VITE_PUBLIC_SITE_URL (set per-environment in Cloudflare
      // Pages) so the redirect target is the deployed URL, not whatever
      // origin happens to be running the code. Falls back to
      // window.location.origin so local `vite dev` still works without
      // explicitly setting the var.
      const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${siteUrl}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send reset email.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>
            Enter your account email and we&apos;ll send a recovery link.
          </CardDescription>
        </CardHeader>
        {sent ? (
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If an account exists for <span className="font-medium text-foreground">{email}</span>,
              a recovery link is on its way. The link expires after a short window.
            </p>
            <Link
              to="/login"
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Back to sign in
            </Link>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  placeholder="you@school.edu.ng"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-3">
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Sending…" : "Send recovery link"}
              </Button>
              <Link
                to="/login"
                className="text-center text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                Back to sign in
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
