"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase-client";
import {
  Building2,
  Users,
  Gamepad2,
  Activity,
  Settings,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

function OrgDashboardContent() {
  const { user, profile, refreshRole } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const orgProfile = profile as {
    name?: string;
    description?: string;
    email?: string;
    status?: string;
    logo_url?: string;
    created_at?: string;
  } | null;

  useEffect(() => {
    setName(orgProfile?.name || "");
    setDescription(orgProfile?.description || "");
  }, [orgProfile]);

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("tg_organizations")
        .update({
          name,
          description: description || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user!.id);
      if (error) throw error;
      await refreshRole();
      toast.success("Organization profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  const isDisabled = orgProfile?.status === "disabled";

  const stats = [
    { icon: Users, label: "Team Members", value: "12", color: "text-primary" },
    {
      icon: Gamepad2,
      label: "Active Games",
      value: "8",
      color: "text-success",
    },
    {
      icon: Activity,
      label: "Monthly Events",
      value: "4",
      color: "text-warning",
    },
    {
      icon: Building2,
      label: "Tournaments",
      value: "23",
      color: "text-accent",
    },
  ];

  const teamMembers = [
    { name: "Alex Rivera", role: "Team Lead", status: "online" },
    { name: "Sam Chen", role: "Developer", status: "online" },
    { name: "Jordan Park", role: "Designer", status: "offline" },
    { name: "Casey Morgan", role: "Community Manager", status: "online" },
  ];

  const events = [
    {
      name: "Summer Championship",
      date: "Jul 15, 2026",
      participants: 128,
      status: "upcoming",
    },
    {
      name: "Weekly Tournament",
      date: "Jul 8, 2026",
      participants: 64,
      status: "upcoming",
    },
    {
      name: "Spring League Finals",
      date: "Jun 28, 2026",
      participants: 256,
      status: "completed",
    },
  ];

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

      {/* Org banner */}
      <Card className="mb-8 overflow-hidden border-border/60 bg-card/50">
        <div className="h-24 bg-gradient-to-r from-warning/20 via-primary/10 to-warning/20" />
        <CardContent className="relative -mt-12 pb-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
            <Avatar className="h-24 w-24 border-4 border-card bg-secondary">
              <AvatarImage src={orgProfile?.logo_url || undefined} />
              <AvatarFallback className="bg-warning/10 text-2xl font-bold text-warning">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-2">
              <h2 className="text-xl font-bold">
                {orgProfile?.name || "Unnamed Organization"}
              </h2>
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
            <div className="pb-2 text-sm text-muted-foreground">
              Member since{" "}
              {orgProfile?.created_at
                ? new Date(orgProfile.created_at).toLocaleDateString()
                : "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="border-border/60 bg-card/50 transition-colors hover:border-primary/40"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Team members */}
        <Card className="lg:col-span-2 border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembers.map((member, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 p-4 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                          member.status === "online"
                            ? "bg-success"
                            : "bg-muted-foreground"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.role}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      member.status === "online"
                        ? "text-success"
                        : "text-muted-foreground"
                    }
                  >
                    {member.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming events */}
        <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-warning" />
              Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.map((event, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border/60 bg-secondary/30 p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{event.name}</p>
                    <Badge
                      variant="secondary"
                      className={
                        event.status === "upcoming"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {event.status}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{event.date}</span>
                    <span>{event.participants} players</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile settings */}
      <Card className="mt-6 border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-primary" />
            Organization Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your organization name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-email">Email</Label>
              <Input
                id="org-email"
                value={orgProfile?.email || ""}
                disabled
                className="opacity-60"
              />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="org-description">Description</Label>
            <Textarea
              id="org-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell the community about your organization..."
              rows={3}
            />
          </div>
          <div className="mt-4">
            <Button onClick={handleSaveProfile} disabled={saving || isDisabled}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
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
