import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";

export default function AdminDashboard() {
  const { profile } = useAuth();
  return (
    <AppShell role="admin">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome, {profile?.full_name ?? "Admin"}. Phase 0 shell — student, class,
          subject, session/term, fee-structure, teacher-assignment, promotion,
          and publish-results modules arrive in Phases 1–4.
        </p>
      </div>
    </AppShell>
  );
}
