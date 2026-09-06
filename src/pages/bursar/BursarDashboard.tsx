import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";

export default function BursarDashboard() {
  const { profile } = useAuth();
  return (
    <AppShell role="bursar">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Bursar dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome, {profile?.full_name ?? "Bursar"}. Phase 0 shell — invoice
          generation, payment entry, and class-level arrears reports arrive in
          Phase 3.
        </p>
      </div>
    </AppShell>
  );
}
