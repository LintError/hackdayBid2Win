import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { AuthError } from "./api-utils";

export type UserRole = "admin" | "judge" | "participant";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
}

/**
 * Get the current authenticated user from the session cookie
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(
              name,
              value,
              options as Parameters<typeof cookieStore.set>[2],
            );
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get profile with role
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("user_id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email!,
    role: profile.role as UserRole,
    displayName: profile.display_name,
  };
}

/**
 * Check if user has required role(s)
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Unauthorized: Please sign in", 401);
  }
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError("Forbidden: Insufficient permissions", 403);
  }
  return user;
}

/**
 * Check if user is an admin
 */
export async function requireAdmin(): Promise<AuthUser> {
  return requireRole(["admin"]);
}

/**
 * Check if user is a judge
 */
export async function requireJudge(): Promise<AuthUser> {
  return requireRole(["admin", "judge"]);
}

/**
 * Check if user is a participant
 */
export async function requireParticipant(): Promise<AuthUser> {
  return requireRole(["admin", "judge", "participant"]);
}