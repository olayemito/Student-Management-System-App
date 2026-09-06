import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types/database";

interface ProtectedRouteProps {
  allow: UserRole | UserRole[];
  children: ReactNode;
}

/**
 * Route guard. Enforces two checks:
 *   1. Auth session exists (otherwise -> /login).
 *   2. Logged-in user's role (from public.users via AuthContext) is in
 *      the allow-list (otherwise -> that user's own role dashboard).
 *
 * Per §2 and §9: this is the UI-level guard. The real security boundary
 * is Postgres RLS on every table (enforced in migration files, Phase 1+).
 * A teacher hitting /admin in the URL bar is bounced here; even if they
 * bypassed this guard, the DB would still reject their reads/writes.
 */
export function ProtectedRoute({ allow, children }: ProtectedRouteProps) {
  const { session, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Authenticated but not provisioned (no public.users row). Surface the
  // generic /dashboard which shows the "Account not provisioned" message.
  if (!role) {
    return <Navigate to="/dashboard" replace />;
  }

  const allowed = Array.isArray(allow) ? allow : [allow];
  if (!allowed.includes(role)) {
    // Wrong role for this route — bounce to their own dashboard.
    const target: Record<UserRole, string> = {
      admin: "/admin",
      teacher: "/teacher",
      bursar: "/bursar",
    };
    return <Navigate to={target[role]} replace />;
  }

  return <>{children}</>;
}
