"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
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

async function resolveRole(
  userId: string,
): Promise<{
  role: UserRole;
  profile: UserProfile | OrganizationProfile | AdminProfile | null;
}> {
  const [userRes, orgRes, adminRes] = await Promise.all([
    supabase.from("tg_users").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("tg_organizations")
      .select("*")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("tg_admins").select("*").eq("id", userId).maybeSingle(),
  ]);

  if (adminRes.data) {
    return { role: "admin", profile: adminRes.data as AdminProfile };
  }
  if (orgRes.data) {
    return {
      role: "organization",
      profile: orgRes.data as OrganizationProfile,
    };
  }
  if (userRes.data) {
    return { role: "user", profile: userRes.data as UserProfile };
  }
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
    const { role: resolvedRole, profile: resolvedProfile } = await resolveRole(
      user.id,
    );
    setRole(resolvedRole);
    setProfile(resolvedProfile);
  }, [user]);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data: { session } }: { data: { session: Session | null } }) => {
        if (!mounted) return;
        if (session?.user) {
          setUser(session.user);
          resolveRole(session.user.id).then(({ role: r, profile: p }) => {
            if (!mounted) return;
            setRole(r);
            setProfile(p);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        (async () => {
          if (!mounted) return;
          if (session?.user) {
            setUser(session.user);
            const { role: r, profile: p } = await resolveRole(session.user.id);
            if (!mounted) return;
            setRole(r);
            setProfile(p);
            setLoading(false);
          } else {
            setUser(null);
            setRole(null);
            setProfile(null);
            setLoading(false);
          }
        })();
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
