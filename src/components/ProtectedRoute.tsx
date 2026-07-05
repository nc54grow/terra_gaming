"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/lib/types";
import { ROLE_DASHBOARD } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: NonNullable<UserRole>[];
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      setRedirecting(true);
      return;
    }

    if (role && !allowedRoles.includes(role)) {
      router.replace(ROLE_DASHBOARD[role]);
      setRedirecting(true);
      return;
    }
  }, [user, role, loading, allowedRoles, router]);

  if (
    loading ||
    redirecting ||
    !user ||
    (role && !allowedRoles.includes(role))
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
