import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types/database";

/**
 * /dashboard — redirects to the role-specific dashboard based on the
 * logged-in user's role from public.users (per §2). This is Phase 0's
 * "Done when": "a user can log in and land on a role-specific empty dashboard."
 */
export default function Dashboard() {
  const { session, profile, role, loading } = useAuth();
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

  // Logged-in auth user without a profile row. This shouldn't happen in
  // normal operation (Phase 1's Create User flow inserts both), but if a
  // recovery-link auth user lands here with no profile, we surface a
  // clear message instead of crashing on a null role.
  if (!profile || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-2">
          <p className="font-medium">Account not provisioned</p>
          <p className="text-sm text-muted-foreground">
            Your login is valid but no staff profile was found. Contact an
            administrator to provision your account.
          </p>
        </div>
      </div>
    );
  }

  const target: Record<UserRole, string> = {
    admin: "/admin",
    teacher: "/teacher",
    bursar: "/bursar",
  };
  return <Navigate to={target[role]} replace />;
}
