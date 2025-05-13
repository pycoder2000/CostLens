export type UserRole = "admin" | "team_lead" | "viewer";

export interface User {
  id: number;
  email: string;
  role: UserRole;
  team_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
