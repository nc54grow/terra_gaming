"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";
import type {
  UserRole,
  UserProfile,
  OrganizationProfile,
  AdminProfile,
} from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  role: UserRole;
  profile: UserProfile | OrganizationProfile | AdminProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// FIXED: Sequential queries - stop at first match
async function resolveRole(userId: string): Promise<{
  role: UserRole;
  profile: UserProfile | OrganizationProfile | AdminProfile | null;
}> {
  console.log("Resolving role for user:", userId);

  // Check admin first (most privileged)
  console.log("Checking tg_admins...");
  const { data: adminData, error: adminError } = await supabase
    .from("tg_admins")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  console.log(
    "Admin query result:",
    adminData ? "Found" : "Not found",
    adminError?.message || "No error",
  );

  if (adminData) {
    console.log("✅ User is ADMIN");
    return { role: "admin", profile: adminData as AdminProfile };
  }

  // Check organization
  console.log("Checking tg_organizations...");
  const { data: orgData, error: orgError } = await supabase
    .from("tg_organizations")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  console.log(
    "Organization query result:",
    orgData ? "Found" : "Not found",
    orgError?.message || "No error",
  );

  if (orgData) {
    console.log("✅ User is ORGANIZATION");
    return { role: "organization", profile: orgData as OrganizationProfile };
  }

  // Check regular user
  console.log("Checking tg_users...");
  const { data: userData, error: userError } = await supabase
    .from("tg_users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  console.log(
    "User query result:",
    userData ? "Found" : "Not found",
    userError?.message || "No error",
  );

  if (userData) {
    console.log("✅ User is REGULAR USER");
    return { role: "user", profile: userData as UserProfile };
  }

  console.log("❌ No role found for user");
  return { role: null, profile: null };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [profile, setProfile] = useState<
    UserProfile | OrganizationProfile | AdminProfile | null
  >(null);
  const [loading, setLoading] = useState(true);

  const refreshRole = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { role: resolvedRole, profile: resolvedProfile } =
        await resolveRole(user.id);
      setRole(resolvedRole);
      setProfile(resolvedProfile);
    } catch (error) {
      console.error("Refresh role error:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      console.log("Initializing auth...");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("Session:", session ? "Found" : "Not found");

        if (session?.user) {
          setUser(session.user);
          console.log("User found:", session.user.id);

          const { role: r, profile: p } = await resolveRole(session.user.id);

          if (!mounted) return;

          console.log("Setting role:", r);
          setRole(r);
          setProfile(p);
        } else {
          console.log("No session found");
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        if (mounted) {
          console.log("Setting loading to false");
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          setLoading(true);
          try {
            const { role: r, profile: p } = await resolveRole(session.user.id);
            if (!mounted) return;
            setRole(r);
            setProfile(p);
          } catch (error) {
            console.error("Role resolution error:", error);
          } finally {
            if (mounted) setLoading(false);
          }
        } else {
          setUser(null);
          setRole(null);
          setProfile(null);
          setLoading(false);
        }
      },
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, role, profile, loading, signOut, refreshRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
