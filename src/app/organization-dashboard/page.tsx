"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, ArrowRight } from "lucide-react";
import { TransitionLink } from "@/components/TransitionLink";

function OrgDashboardContent() {
  const { profile } = useAuth();

  const orgProfile = profile as {
    name?: string;
    description?: string;
    email?: string;
    status?: string;
    logo_url?: string;
    created_at?: string;
  } | null;

  const isDisabled = orgProfile?.status === "disabled";

  const initials =
    (orgProfile?.name || "O")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "O";

  return (
    <DashboardShell
      role="organization"
      title={orgProfile?.name || "Organization"}
      subtitle="Manage your organization's profile, team, and events."
    >
      {isDisabled && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-warning" />
          <p className="text-sm text-warning">
            Your organization account is currently{" "}
            <span className="font-semibold">disabled</span> by an administrator.
            Some features may be unavailable. Contact support to restore access.
          </p>
        </div>
      )}

      {/* Quick Profile Card */}
      <Card className="mb-6 overflow-hidden border-border/60 bg-card/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-border bg-secondary">
                <AvatarImage src={orgProfile?.logo_url || undefined} />
                <AvatarFallback className="bg-warning/10 text-xl font-bold text-warning">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">
                  {orgProfile?.name || "Unnamed Organization"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {orgProfile?.email}
                </p>
                <div className="mt-2 flex gap-2">
                  <Badge
                    className="bg-warning/10 text-warning hover:bg-warning/20"
                    variant="secondary"
                  >
                    Organization
                  </Badge>
                  <Badge
                    className={
                      isDisabled
                        ? "bg-destructive/15 text-destructive"
                        : "bg-success/15 text-success"
                    }
                    variant="secondary"
                  >
                    {isDisabled ? "Disabled" : "Active"}
                  </Badge>
                </div>
              </div>
            </div>
            <TransitionLink href="/organization-dashboard/profile">
              <Button variant="outline" className="gap-2">
                Edit Profile
                <ArrowRight className="h-4 w-4" />
              </Button>
            </TransitionLink>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

export default function OrganizationDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["organization"]}>
      <OrgDashboardContent />
    </ProtectedRoute>
  );
}
