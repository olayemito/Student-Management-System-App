import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";

export default function TeacherDashboard() {
  const { profile } = useAuth();
  return (
    <AppShell role="teacher">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Teacher dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome, {profile?.full_name ?? "Teacher"}. Phase 0 shell — my-classes
          list and the per-class per-subject score entry grid arrive in Phase 2.
        </p>
      </div>
    </AppShell>
  );
}
