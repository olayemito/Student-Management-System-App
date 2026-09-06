import { type ReactNode } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types/database";

const roleLabel: Record<UserRole, string> = {
  admin: "Administrator",
  teacher: "Teacher",
  bursar: "Bursar",
};

interface AppShellProps {
  role: UserRole;
  children: ReactNode;
}

/**
 * Top-bar shell for authenticated pages. Phase 0 deliberately has no
 * sidebar nav — phase-specific modules will hang their nav items off
 * this shell as they arrive.
 */
export function AppShell({ role, children }: AppShellProps) {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold tracking-tight">
              School MS
            </span>
            <span className="text-xs rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
              {roleLabel[role]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {profile?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void signOut()}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}
