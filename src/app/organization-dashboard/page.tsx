"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CircleAlert as AlertCircle,
  ArrowRight,
  Trophy,
  Plus,
  Calendar,
  Users,
  IndianRupee,
} from "lucide-react";
import { TransitionLink } from "@/components/TransitionLink";
import { useEffect, useState } from "react";
import { listTournaments, type Tournament } from "@/lib/tournament-api";

function OrgDashboardContent() {
  const { profile } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  const orgProfile = profile as {
    name?: string;
    description?: string;
    email?: string;
    status?: string;
    logo_url?: string;
    created_at?: string;
  } | null;

  const isDisabled = orgProfile?.status === "disabled";

  useEffect(() => {
    let mounted = true;
    listTournaments()
      .then((data) => mounted && setTournaments(data))
      .catch(() => mounted && setTournaments([]))
      .finally(() => mounted && setLoadingTournaments(false));
    return () => {
      mounted = false;
    };
  }, []);

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

      {/* Tournaments section */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Trophy className="h-5 w-5 text-warning" />
          Your Tournaments
        </h2>
        <TransitionLink href="/organization-dashboard/tournaments/new">
          <Button className="glow-primary">
            <Plus className="mr-1.5 h-4 w-4" />
            Host Tournament
          </Button>
        </TransitionLink>
      </div>

      {loadingTournaments ? (
        <Card className="border-border/60 bg-card/50">
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              Loading tournaments...
            </p>
          </CardContent>
        </Card>
      ) : tournaments.length === 0 ? (
        <Card className="border-border/60 bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium">No tournaments yet</p>
            <p className="text-xs text-muted-foreground mb-4">
              Host your first tournament to get started.
            </p>
            <TransitionLink href="/organization-dashboard/tournaments/new">
              <Button className="glow-primary">
                <Plus className="mr-1.5 h-4 w-4" />
                Host Tournament
              </Button>
            </TransitionLink>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t) => (
            <Card
              key={t.id}
              className="border-border/60 bg-card/50 transition-colors hover:border-warning/40"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.total_rounds} rounds · {t.total_slots} slots
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      t.status === "published"
                        ? "bg-success/15 text-success"
                        : t.status === "ongoing"
                          ? "bg-primary/15 text-primary"
                          : t.status === "completed"
                            ? "bg-muted text-muted-foreground"
                            : "bg-warning/15 text-warning"
                    }
                  >
                    {t.status}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {Number(t.prize_pool).toLocaleString("en-IN")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {t.total_slots}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(t.registration_start).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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
