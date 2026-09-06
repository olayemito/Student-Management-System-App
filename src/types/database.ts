// Minimal Phase 0 types. Expanded in subsequent phases as tables are added
// by the matching migration files (see supabase/migrations/).

export type UserRole = "admin" | "teacher" | "bursar";

export interface UserRow {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Database shape consumed by createClient<Database>.
// Only the public.users table exists in Phase 0.
export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: {
          id: string; // FK to auth.users.id
          email: string;
          full_name: string;
          role: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserRow, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
